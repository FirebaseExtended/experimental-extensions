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
import { getEventarc } from "firebase-admin/eventarc";
import config from "./config";
import * as log from "./logs";
import { getExportPaths } from "./get_export_paths";
import { uploadDataAsZip } from "./upload_as_zip";
import { uploadAsCSVs } from "./upload_as_csv";
import { finalizeExport, getDatabaseUrl, initializeExport } from "./utils";
import { copyStorageFilesToExportDirectory } from "./construct_exports";

const databaseURL = getDatabaseUrl(
  config.selectedDatabaseInstance,
  config.selectedDatabaseLocation
);

// Initialize the Firebase Admin SDK
admin.initializeApp({
  databaseURL,
  storageBucket: config.storageBucketDefault,
});

export const eventChannel =
  process.env.EVENTARC_CHANNEL &&
  getEventarc().channel(process.env.EVENTARC_CHANNEL, {
    allowedEventTypes: process.env.EXT_SELECTED_EVENTS,
  });

/**
 * Export user data from Cloud Firestore, Realtime Database, and Cloud Storage.
 */
export const exportUserData = functions.https.onCall(async (_data, context) => {
  // get the user id
  const uid = context.auth.uid;

  // create a record of the export in firestore and get its id
  const exportId = await initializeExport(uid);

  // this is the path to the exported data in Cloud Storage
  const storagePrefix = `${config.cloudStorageExportDirectory}/${uid}/${exportId}`;

  // get the paths specified by config and/or custom hook.
  const exportPaths = await getExportPaths(uid);

  // copy the files from Cloud Storage to the export directory and return their file refs
  const filesToZip = await copyStorageFilesToExportDirectory(
    exportPaths.storagePaths,
    uid
  );

  if (config.zip) {
    try {
      await uploadDataAsZip({
        exportPaths,
        storagePrefix,
        uid,
        exportId,
        filesToZip,
      });
    } catch (e) {
      log.exportError(e);
    }
  } else {
    // uploads firestore and database data as csvs
    await uploadAsCSVs(exportPaths, storagePrefix, uid);
  }

  await finalizeExport(storagePrefix, uid, exportId, exportPaths);

  return { exportId };
});
