"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const MERGE_WRITE = process.env.MERGE_WRITE === "true";
const BATCH_SIZE = 100;
const QUEUE_COLLECTION = process.env.QUEUE_COLLECTION || "queued_writes";
const TARGET_COLLECTION = process.env.TARGET_COLLECTION;
const STALENESS_THRESHOLD_SECONDS = parseInt(process.env.STALENESS_THRESHOLD_SECONDS || "0", 10);
const CLEANUP = process.env.CLEANUP || "DELETE";
const db = admin.firestore();
const queueRef = db.collection(QUEUE_COLLECTION);
const targetRef = TARGET_COLLECTION ? db.collection(TARGET_COLLECTION) : null;
async function fetchAndProcess() {
    const toProcess = await queueRef
        .where("state", "==", "PENDING")
        .where("deliverTime", "<=", admin.firestore.Timestamp.now())
        .orderBy("deliverTime")
        .limit(BATCH_SIZE)
        .get();
    if (toProcess.docs.length === 0) {
        functions.logger.info("No writes to process.");
        return;
    }
    const promises = toProcess.docs.map((doc) => {
        return processWrite(doc.ref, doc.data());
    });
    const results = await Promise.all(promises);
    let successCount = 0;
    for (const result of results) {
        if (result.success) {
            successCount++;
            continue;
        }
        functions.logger.error(`Failed to deliver "${QUEUE_COLLECTION}/${result.id}":`, result.error);
    }
    functions.logger.info(`Delivered ${successCount} queued writes.`);
    if (toProcess.docs.length === BATCH_SIZE) {
        return fetchAndProcess();
    }
}
function isStale(write) {
    return ((write.invalidAfterTime &&
        write.invalidAfterTime.toMillis() < Date.now()) ||
        (STALENESS_THRESHOLD_SECONDS > 0 &&
            write.deliverTime.toMillis() + STALENESS_THRESHOLD_SECONDS * 1000 <
                Date.now()));
}
async function processWrite(ref, write) {
    let error;
    try {
        if (!write.collection && !write.doc && !TARGET_COLLECTION) {
            throw new Error("no target collection/doc was specified for this write");
        }
        await admin.firestore().runTransaction(async (txn) => {
            const existingWrite = await txn.get(ref);
            if (existingWrite.get("state") !== "PENDING") {
                throw new Error(`expected PENDING state but was ${existingWrite.get("state")}`);
            }
            return txn.update(ref, {
                state: "PROCESSING",
                attempts: admin.firestore.FieldValue.increment(1),
                startTime: admin.firestore.FieldValue.serverTimestamp(),
                updateTime: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        if (isStale(write)) {
            functions.logger.warn(`Write "${QUEUE_COLLECTION}/${ref.id}" is past invalidAfterTime, skipped delivery.`);
        }
        else {
            await deliver(write);
            functions.logger.info(`Delivered write "${QUEUE_COLLECTION}/${ref.id}"`);
        }
    }
    catch (e) {
        error = e;
        await ref.update({
            state: "FAILED",
            error: { message: e.message },
            updateTime: admin.firestore.FieldValue.serverTimestamp(),
            endTime: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    if (!error) {
        switch (CLEANUP) {
            case "DELETE":
                await ref.delete();
            case "KEEP":
                await ref.update({
                    state: "DELIVERED",
                    updateTime: admin.firestore.FieldValue.serverTimestamp(),
                    endTime: admin.firestore.FieldValue.serverTimestamp(),
                });
        }
    }
    return { success: !!error, error, id: ref.id };
}
async function resetStuck() {
    const stuck = await queueRef
        .where("state", "==", "PROCESSING")
        .where("leaseExpireTime", "<=", admin.firestore.Timestamp.now())
        .limit(BATCH_SIZE)
        .select()
        .get();
    await Promise.all(stuck.docs.map(async (doc) => {
        await doc.ref.update({
            state: "PENDING",
            timeouts: admin.firestore.FieldValue.increment(1),
            lastTimeoutTime: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.error(`Write "${QUEUE_COLLECTION}/${doc.id}" was still PROCESSING after lease expired. Reset to PENDING.`);
    }));
    if (stuck.docs.length === BATCH_SIZE) {
        return resetStuck();
    }
}
function deliver(write) {
    let ref;
    if (TARGET_COLLECTION && write.id) {
        ref = targetRef.doc(write.id);
    }
    else if (TARGET_COLLECTION) {
        ref = targetRef.doc();
    }
    else if (write.doc) {
        ref = db.doc(write.doc);
    }
    else if (write.collection) {
        ref = db.collection(write.collection).doc();
    }
    else {
        throw new Error(`unable to determine write location from scheduled write: ${JSON.stringify(write)}`);
    }
    const data = Object.assign({}, write.data);
    for (const field of write.serverTimestampFields || []) {
        data[field] = admin.firestore.FieldValue.serverTimestamp();
    }
    return ref.set(data, { merge: MERGE_WRITE });
}
exports.deliverWrites = functions.handler.pubsub.schedule.onRun(async () => {
    try {
        await resetStuck();
        await fetchAndProcess();
    }
    catch (e) {
        console.error(e);
    }
});
//# sourceMappingURL=index.js.map