/*
 * Copyright 2020 Google LLC
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

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as logs from "./logs";
import config from "./config";
import { search } from "./search";
import { ExportDocumentData, ExportCollectionData } from "./exportData";

if (!admin.apps.length) {
  admin.initializeApp({});
}

export const handleDeletion = functions.pubsub
  .topic("export")
  .onPublish(async (message, context) => {
    console.log("Runing handleDeletion");

    const { path, uid } = JSON.parse(
      Buffer.from(message.data, "base64").toString("utf8")
    );

    /** Export collection */
    if (path.includes(uid)) {
      return ExportCollectionData(path, uid);
    }

    /** Check for subcollections and documents */
    const collection = admin.firestore().collection(path);

    /** Iterate through documents */
    const docs = await collection.listDocuments();

    docs.forEach(async (doc) => {
      /** Check id value */
      if (doc.path.includes(uid)) {
        await ExportDocumentData(doc, uid);
      }

      /** Check field/value */
      const data = await doc.get();
      const fields = data.data();
      if (fields) {
        Object.entries(fields).forEach(async ([field, value]) => {
          if (field?.includes(uid || value?.includes(uid))) {
            await ExportDocumentData(doc, uid);
          }
        });
      }

      const depth = doc.path.split("/").length;

      /** Hard code limit to subcollection data only */
      if (depth < 3) {
        await search(uid, doc);
      }
    });

    return Promise.resolve();
  });

export const exportUserData = functions.https.onCall(async (data, context) => {
  // Checking that the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "No valid authentication token provided."
    );
  }

  /** check if noticeId has been provided  */
  if (!data.uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No uid provided."
    );
  }

  await search(data.uid).then(() => console.log("Started export"));
});
