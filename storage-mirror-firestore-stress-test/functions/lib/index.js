"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mirrorStressTestTaskRunner = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp();
exports.mirrorStressTestTaskRunner = functions.database
    .ref("/tasks/{taskId}")
    .onCreate((snapshot, context) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = context.params.taskId;
    const task = snapshot.val();
    if (!task.bucket)
        throw new Error("A bucket must be specified for a Task.");
    const bucket = admin.storage().bucket(task.bucket);
    const configRef = snapshot.ref.parent.parent;
    console.log(`Task[${taskId}] Started.`);
    // Process Operation Sets in parallel, within each Set, process Operations synchronously.
    const promises = task.operations.map((operationSet, setId) => performOperations(bucket, operationSet, setId, taskId));
    // Wait for all Operation Sets to finish, collect the errors (if any).
    const errors = {};
    const results = yield Promise.all(promises.map((promise) => promise.then(() => null).catch((reason) => reason)));
    // Errors can be overwritten if the `onCreate` callback is called multiple times for a Task and the same
    // Operation Set fails more than once.
    results.forEach((reason, setId) => {
        if (reason)
            errors[setId] = reason.toString();
    });
    // Clean up task and update errors if they exist.
    return configRef
        .update({
        [`tasks/${taskId}`]: null,
        [`errors/${taskId}`]: errors,
    })
        .catch((err) => console.error(`Task[${taskId}] clean up failed because:`, err));
}));
/**
 * Performs a set of GCS Operations sequentially. Will throw an Error and end early if any operation fails.
 * @param bucket The GCS Bucket to perform operations on.
 * @param set The `OperationSet` to process.
 * @param setId The id of this `OperationSet` (for logging).
 * @param taskId The id of this `Task` (for logging).
 */
const performOperations = (bucket, set, setId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    let i = 0;
    try {
        for (; i < set.length; i++) {
            const operation = set[i];
            const file = bucket.file(operation.path);
            console.log(`Task[${taskId}] Operation Set[${setId}], Operation[${i}]: ${JSON.stringify(operation)}`);
            if (operation.type === "write") {
                // Array of `size` bytes (0x00 to 0xFF repeating).
                const data = Buffer.from(Array.from(Array(operation.size).keys()));
                // Resumable uploads disabled as recommended: https://googleapis.dev/nodejs/storage/latest/File.html#save
                yield file.save(data, {
                    resumable: false,
                    metadata: { metadata: operation.metadata },
                });
            }
            else if (operation.type === "delete") {
                yield file.delete();
            }
            else if (operation.type === "update") {
                yield file.setMetadata({ metadata: operation.metadata });
            }
        }
        console.log(`Task[${taskId}] Operation Set[${setId}] Finished.`);
    }
    catch (e) {
        console.error(`Task[${taskId}] Operation Set[${setId}] Operation[${i}]`, set[i], e.toString());
        throw e;
    }
});
