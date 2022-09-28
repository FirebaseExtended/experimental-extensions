/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import config from "./config";
import {
  constructDatabaseCSV,
  constructFirestoreCollectionCSV,
  constructFirestoreDocumentCSV,
} from "./construct";
import { getPaths } from "./getPaths";

// Initialize the Firebase Admin SDK
admin.initializeApp({
  databaseURL: config.databaseLocation,
});

const initializeExport = async (uid: string, startedAt) => {
  const exportDoc = await admin.firestore().collection("exports").add({
    uid,
    status: "pending",
    started_at: startedAt,
  });

  return exportDoc.id;
};

export const exportUserData = functions.https.onCall(async (_data, context) => {
  // console.log(admin.firestore);
  const startedAt = "now";

  // const startedAt = admin.firestore.FieldValue.serverTimestamp();

  // TODO get from call
  const uid = "123";

  const exportId = await initializeExport(uid, startedAt);

  const { firestorePaths, databasePaths } = await getPaths(uid);
  const { collections, docs } = firestorePaths;

  const promises = [];

  for (let collection of collections) {
    const snap = await admin.firestore().collection(collection).get();

    if (!snap.empty) {
      const csv = await constructFirestoreCollectionCSV(snap, collection);
      promises.push(uploadToStorage(csv, uid, exportId, collection));
    }
  }

  for (let doc of docs) {
    const snap = await admin.firestore().doc(doc).get();

    if (snap.exists) {
      const csv = await constructFirestoreDocumentCSV(snap, doc);
      promises.push(uploadToStorage(csv, uid, exportId, doc));
    }
  }

  for (let path of databasePaths) {
    const snap = await admin.database().ref(path).once("value");

    if (snap.exists()) {
      const csv = await constructDatabaseCSV(snap, path);
      promises.push(uploadToStorage(csv, uid, exportId, `database/${path}`));
    }
  }

  await Promise.all(promises);

  return { exportId };
});

const uploadToStorage = async (
  csv: string,
  uid: string,
  exportId: string,
  path: string
) => {
  const formattedPath = path.replace(/\//g, "_");

  const storagePath = `${config.storageExportDirectory}/${uid}/${exportId}/${formattedPath}.csv`;

  const file = admin.storage().bucket(config.storageBucket).file(storagePath);

  await file.save(csv);

  await admin.firestore().doc(`exports/${exportId}`).update({
    status: "complete",
    storagePath: storagePath,
  });

  return storagePath;
};
