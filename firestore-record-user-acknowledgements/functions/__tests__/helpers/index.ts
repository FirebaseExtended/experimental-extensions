import { DocumentData, Query } from "firebase-admin/firestore";

export const waitForDocumentUpdate = (
  document: DocumentData,
  field: string | number,
  value: any,
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
      if (snapshot.exists && snapshot.data()[field] === value) {
        unsubscribe();
        if (!timedOut) {
          clearTimeout(timer);
          resolve(snapshot);
        }
      }
    });
  });
};

export const waitForDocumentToExistInCollection = (
  query: Query,
  field: string | number,
  value: any,
  timeout: number = 10_000
): Promise<DocumentData> => {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      reject(
        new Error(
          `Timeout waiting for firestore document to exist with field ${field} in collection`
        )
      );
    }, timeout);

    const unsubscribe = query.onSnapshot(async (snapshot) => {
      const docs = snapshot.docChanges();

      const record: DocumentData = docs.filter(
        ($) => $.doc.data()[field] === value
      )[0];

      if (record) {
        unsubscribe();
        if (!timedOut) {
          clearTimeout(timer);
          resolve(record);
        }
      }
    });
  });
};
