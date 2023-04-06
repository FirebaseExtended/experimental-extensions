import { DocumentData } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

const hasValue = (
  snapshot,
  field: string,
  value: string | number | number[]
): boolean => {
  if (!snapshot.exists) return false;

  const hasMultipleOptions = Array.isArray(value);

  if (!hasMultipleOptions) return snapshot.data()[field.toString()];

  return value.includes(snapshot.data()[field]);
};

export const waitForDocumentUpdate = (
  document: DocumentData,
  field: string,
  value: string | number | number[],
  timeout: number = 10_000
): Promise<FirebaseFirestore.DocumentData> => {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      reject(
        new Error(
          `Timeout waiting for firestore document to update with ${field}`
        )
      );
    }, timeout);
    const unsubscribe = document.onSnapshot(async (snapshot: DocumentData) => {
      if (hasValue(snapshot, field, value)) {
        unsubscribe();
        if (!timedOut) {
          clearTimeout(timer);
          resolve(snapshot);
        }
      }
    });
  });
};

export const getFutureTimestamp = (): FirebaseFirestore.Timestamp => {
  const oneYearInTheFuture = new Date();
  oneYearInTheFuture.setFullYear(oneYearInTheFuture.getFullYear() + 1);
  return admin.firestore.Timestamp.fromDate(oneYearInTheFuture);
};
