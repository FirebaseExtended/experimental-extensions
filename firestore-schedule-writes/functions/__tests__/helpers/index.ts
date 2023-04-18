import * as admin from "firebase-admin";
import * as config from "../../src/config";

import fetch from "node-fetch";

export const addProcessingDocuments = async (
  count: number,
  state = "PENDING",
  options = {}
) => {
  const db = admin.firestore();
  const collection = db.collection(config.default.queueCollection);

  // Create a batch object
  const batch = db.batch();

  // Create an array of documents to be added
  const docs = Array.from(Array(count), (_, i) => ({
    data: {
      document: i,
    },
    state,
    timeouts: 0,
    ...options,
  }));

  // Add each document to the batch
  docs.forEach((doc) => {
    const docRef = collection.doc();
    batch.set(docRef, doc);
  });

  // Commit the batch write operation
  await batch.commit();

  // Retrieve the documents from the collection
  const snap = await collection.get();

  return snap.docs;
};

export const clearFirestore = async (): Promise<void> => {
  await fetch(
    "http://localhost:8080/emulator/v1/projects/demo-test/databases/(default)/documents",
    { method: "DELETE" }
  );
};
