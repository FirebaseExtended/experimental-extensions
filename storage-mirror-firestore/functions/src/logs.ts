import * as functions from "firebase-functions";

import config from "./config";
import { Constants } from "./constants";

export const error = (err: Error, action?: string) => {
  const message = action ? `Error while ${action}:` : "Error:";
  console.error(message, err);
};

export const start = () => {
  console.log("Started Function execution with Configuration:", config);
};
export const startHttpEvent = () => {
  console.log("Started Http Function execution with Configuration:", config);
};

export const metadata = (m: functions.storage.ObjectMetadata) => {
  console.log(`Event triggered with Object metadata: ${JSON.stringify(m)}`);
};

export const startingTransaction = (path: string, attemptNo: number) => {
  console.log(
    `Starting Transaction attempt number ${attemptNo} for Item Document: ${path}`
  );
};

export const abortingStaleEvent = (
  path: string,
  eventTime: any,
  existingTime: any
) => {
  console.log(
    "Aborting update of " +
      path +
      " because incoming timestamp (" +
      eventTime +
      ") is older than existing timestamp (" +
      existingTime +
      ")"
  );
};

export const staleTieBreak = (
  path: string,
  eventTime: any,
  existingTime: any
) => {
  console.log(
    "Aborting update of " +
      path +
      " because incoming timestamp (" +
      eventTime +
      ") is equal to existing timestamp (" +
      existingTime +
      ")"
  );
};

export const eventNotStale = (
  path: string,
  eventTime: any,
  existingTime: any
) => {
  console.log(
    "Update for " +
      path +
      "is stale because incoming timestamp (" +
      eventTime +
      ") is newer than existing timestamp (" +
      existingTime +
      ")"
  );
};

export const docDoesNotExist = (path: string) => {
  console.log(`${path} is not stale because it does not yet exist.`);
};

export const transactionFailure = (path: string, reason: any) => {
  console.error(`Transaction to update ${path} failed because:`, reason);
};

export const skippedOverwrite = (name: string, eventType: string) => {
  console.log(
    `Skipped write for ${eventType} event on ${name} because the object exists. This was likely an overwrite of the object.`
  );
};

export const skippedObject = (name: string) => {
  console.log(`Skipping Object with name not matching filter: ${name}`);
};

export const skippedMissingPath = (name: string) => {
  console.log(
    `Skipping mirroring of path "${name}" because no data was found in Firestore or GCS`
  );
};

export const invalidObjectName = (name: string) => {
  console.log(`Skipping Object with invalid name: ${name}`);
};

export const context = (m: functions.EventContext) => {
  console.log("Event Context", m);
};

export const transactionReads = (paths: string[]) => {
  console.log(`This transaction read ${paths.length} documents: ${paths}`);
};

export const transactionWriteAttempt = (num: number, paths: string[]) => {
  console.log(`Attempting to write ${num} documents: ${paths}`);
};

export const transactionDeleteAttempt = (num: number, paths: string[]) => {
  console.log(`Attempting to delete ${num} documents: ${paths}`);
};

export const invalidPrefixDocument = (id: string) => {
  console.log(
    `Missing fields in Prefix Document with id: ${id} treating the Document as requiring deletion.`
  );
};

export const missingLastEventField = (id: string) => {
  console.log(
    `Missing ${Constants.lastEventField} field in Document with id: ${id}, treating as stale.`
  );
};
