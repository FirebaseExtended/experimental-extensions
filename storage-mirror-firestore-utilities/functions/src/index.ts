import { Bucket } from "@google-cloud/storage";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Describes the GCS operation to be performed.
export type Operation = (
  | { type: "write"; size: number; metadata?: any }
  | { type: "update"; metadata: any }
  | { type: "delete" }
) & { path: string };
// A set of Operations to be performed sequentially.
export type OperationSet = Operation[];
// A group of Operation Sets that can be performed in parallel.
export type Task = { bucket: string; operations: OperationSet[] };

admin.initializeApp();

export const mirrorStressTestTaskRunner = functions.database
  .ref("/tasks/{taskId}")
  .onCreate(async (snapshot, context) => {
    const taskId = context.params.taskId;
    const task = snapshot.val() as Task;
    if (!task.bucket) throw new Error("A bucket must be specified for a Task.");
    const bucket = admin.storage().bucket(task.bucket);
    const configRef = <admin.database.Reference>snapshot.ref.parent!.parent;
    console.log(`Task[${taskId}] Started.`);
    // Process Operation Sets in parallel, within each Set, process Operations synchronously.
    const promises: Promise<void>[] = task.operations.map(
      (operationSet, setId) =>
        performOperations(bucket, operationSet, setId, taskId)
    );
    // Wait for all Operation Sets to finish, collect the errors (if any).
    const errors: { [setId: string]: string } = {};
    const results = await Promise.all(
      promises.map((promise) =>
        promise.then(() => null).catch((reason) => reason)
      )
    );
    // Errors can be overwritten if the `onCreate` callback is called multiple times for a Task and the same
    // Operation Set fails more than once.
    results.forEach((reason, setId) => {
      if (reason) errors[setId] = reason.toString();
    });
    // Clean up task and update errors if they exist.
    return configRef
      .update({
        [`tasks/${taskId}`]: null,
        [`errors/${taskId}`]: errors,
      })
      .catch((err) =>
        console.error(`Task[${taskId}] clean up failed because:`, err)
      );
  });

/**
 * Performs a set of GCS Operations sequentially. Will throw an Error and end early if any operation fails.
 * @param bucket The GCS Bucket to perform operations on.
 * @param set The `OperationSet` to process.
 * @param setId The id of this `OperationSet` (for logging).
 * @param taskId The id of this `Task` (for logging).
 */
const performOperations = async (
  bucket: Bucket,
  set: OperationSet,
  setId: number,
  taskId: string
) => {
  let i = 0;
  try {
    for (; i < set.length; i++) {
      const operation = set[i];
      const file = bucket.file(operation.path);
      console.log(
        `Task[${taskId}] Operation Set[${setId}], Operation[${i}]: ${JSON.stringify(
          operation
        )}`
      );
      if (operation.type === "write") {
        // Array of `size` bytes (0x00 to 0xFF repeating).
        const data = Buffer.from(Array.from(Array(operation.size).keys()));
        // Resumable uploads disabled as recommended: https://googleapis.dev/nodejs/storage/latest/File.html#save
        await file.save(data, {
          resumable: false,
          metadata: { metadata: operation.metadata },
        });
      } else if (operation.type === "delete") {
        await file.delete();
      } else if (operation.type === "update") {
        await file.setMetadata({ metadata: operation.metadata });
      }
    }
    console.log(`Task[${taskId}] Operation Set[${setId}] Finished.`);
  } catch (e) {
    console.error(
      `Task[${taskId}] Operation Set[${setId}] Operation[${i}]`,
      set[i],
      e.toString()
    );
    throw e;
  }
};
