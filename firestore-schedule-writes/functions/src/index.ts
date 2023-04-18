import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import config from "./config";

admin.initializeApp();

interface QueuedWrite {
  state: "PENDING" | "PROCESSING" | "DELIVERED" | "ERRORED";
  collection?: string;
  doc?: string;
  id?: string;
  error?: {
    message: string;
    status?: string;
  };
  deliverTime: admin.firestore.Timestamp;
  invalidAfterTime?: admin.firestore.Timestamp;
  data: any;
  serverTimestampFields?: string[];
}

const BATCH_SIZE = 100;

const {
  mergeWrite,
  queueCollection,
  targetCollection,
  stalenessThresholdSeconds,
  cleanup,
} = config;

async function fetchAndProcess(): Promise<void> {
  const queueRef = admin.firestore().collection(queueCollection);

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
    return processWrite(doc.ref, doc.data() as QueuedWrite);
  });

  const results = await Promise.all(promises);
  let successCount = 0;
  for (const result of results) {
    if (result.success) {
      successCount++;
      continue;
    }

    functions.logger.error(
      `Failed to deliver "${queueCollection}/${result.id}":`,
      result.error
    );
  }
  functions.logger.info(`Delivered ${successCount} queued writes.`);

  if (toProcess.docs.length === BATCH_SIZE) {
    return fetchAndProcess();
  }
}

interface ProcessResult {
  id: string;
  success: boolean;
  error?: Error;
}

function isStale(write: QueuedWrite): boolean {
  return (
    (write.invalidAfterTime &&
      write.invalidAfterTime.toMillis() < Date.now()) ||
    (stalenessThresholdSeconds > 0 &&
      write.deliverTime.toMillis() + stalenessThresholdSeconds * 1000 <
        Date.now())
  );
}

async function processWrite(
  ref: FirebaseFirestore.DocumentReference,
  write: QueuedWrite
): Promise<ProcessResult> {
  let error;
  try {
    if (!write.collection && !write.doc && !targetCollection) {
      throw new Error("no target collection/doc was specified for this write");
    }

    await admin.firestore().runTransaction(async (txn) => {
      const existingWrite = await txn.get(ref);
      if (existingWrite.get("state") !== "PENDING") {
        throw new Error(
          `expected PENDING state but was ${existingWrite.get("state")}`
        );
      }

      return txn.update(ref, {
        state: "PROCESSING",
        attempts: admin.firestore.FieldValue.increment(1),
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        updateTime: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    if (isStale(write)) {
      functions.logger.warn(
        `Write "${queueCollection}/${ref.id}" is past invalidAfterTime, skipped delivery.`
      );
    } else {
      await deliver(write);
      functions.logger.info(`Delivered write "${queueCollection}/${ref.id}"`);
    }
  } catch (e: any) {
    error = e;
    await ref.update({
      state: "FAILED",
      error: { message: e.message as string },
      updateTime: admin.firestore.FieldValue.serverTimestamp(),
      endTime: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  if (!error) {
    switch (cleanup) {
      case "DELETE":
        await ref.delete();
        break;
      case "KEEP":
        await ref.update({
          state: "DELIVERED",
          updateTime: admin.firestore.FieldValue.serverTimestamp(),
          endTime: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
    }
  }

  return { success: !error, error, id: ref.id };
}

async function resetStuck(): Promise<void> {
  const queueRef = admin.firestore().collection(queueCollection);

  const stuck = await queueRef
    .where("state", "==", "PROCESSING")
    .where("leaseExpireTime", "<=", admin.firestore.Timestamp.now())
    .limit(BATCH_SIZE)
    .select()
    .get();

  console.log("stuck", stuck.docs.length);

  await Promise.all(
    stuck.docs.map(async (doc) => {
      await doc.ref.update({
        state: "PENDING",
        timeouts: admin.firestore.FieldValue.increment(1),
        lastTimeoutTime: admin.firestore.FieldValue.serverTimestamp(),
      });
      functions.logger.error(
        `Write "${queueCollection}/${doc.id}" was still PROCESSING after lease expired. Reset to PENDING.`
      );
    })
  );

  if (stuck.docs.length === BATCH_SIZE) {
    return resetStuck();
  }
}

function getTargetRef(write: QueuedWrite) {
  const targetRef = targetCollection
    ? admin.firestore().collection(targetCollection)
    : null;

  if (targetCollection && write.id) return targetRef!.doc(write.id);
  if (targetCollection) return targetRef!.doc();
  if (write.doc) return admin.firestore().doc(write.doc);
  if (write.collection)
    return admin.firestore().collection(write.collection).doc();
  throw new Error(
    `unable to determine write location from scheduled write: ${JSON.stringify(
      write
    )}`
  );
}

function deliver(write: QueuedWrite) {
  const ref = getTargetRef(write);

  const data = { ...write.data };
  for (const field of write.serverTimestampFields || []) {
    data[field] = admin.firestore.FieldValue.serverTimestamp();
  }

  return ref.set(data, { merge: mergeWrite });
}

exports.deliverWrites = functions.pubsub
  .schedule(config.schedule)
  .onRun(async () => {
    try {
      await resetStuck();
      await fetchAndProcess();
    } catch (e) {
      console.error(e);
    }
  });
