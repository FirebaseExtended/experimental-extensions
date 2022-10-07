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
import config from "./config";
import * as log from "./logs";
import {
  constructDatabaseCSV,
  constructFirestoreCollectionCSV,
  constructFirestoreDocumentCSV,
} from "./construct_exports";
import { ExportPaths } from "./get_export_paths";
import { replaceUID } from "./utils";
import { eventChannel } from ".";

interface CSVUploadCount {
  firestoreCount: number;
  databaseCount: number;
}

export async function uploadAsCSVs(
  exportPaths: ExportPaths,
  storagePrefix: string,
  uid: string
): Promise<CSVUploadCount> {
  const promises = [];
  let firestoreCollectionsUploaded = 0;
  let firestoreDocumentsUploaded = 0;
  let databaseNodesUploaded = 0;

  for (let path of exportPaths.firestorePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      if (pathWithUID.split("/").length % 2 === 1) {
        const snap = await admin.firestore().collection(pathWithUID).get();
        if (!snap.empty) {
          log.firestorePathExporting(pathWithUID);

          if (eventChannel) {
            await eventChannel.publish({
              type: `firebase.extensions.export-user-data.v1.firestore`,
              data: {
                uid,
                collectionPath: pathWithUID,
              },
            });
          }

          const csv = constructFirestoreCollectionCSV(snap, pathWithUID);

          promises.push(
            uploadCSVToStorage(
              csv,
              storagePrefix,
              pathWithUID,
              ".firestore.csv"
            ).then(() => {
              log.firestorePathExported(pathWithUID);
              firestoreCollectionsUploaded++;
            })
          );
        }
      } else {
        const doc = await admin.firestore().doc(pathWithUID).get();

        if (eventChannel) {
          await eventChannel.publish({
            type: `firebase.extensions.export-user-data.v1.firestore`,
            data: {
              uid,
              pathName: pathWithUID,
            },
          });
        }

        const csv = constructFirestoreDocumentCSV(doc, pathWithUID);
        promises.push(
          uploadCSVToStorage(
            csv,
            storagePrefix,
            pathWithUID,
            ".firestore.csv"
          ).then(() => {
            log.firestorePathExported(pathWithUID);
            firestoreDocumentsUploaded++;
          })
        );
      }
    }
  }

  for (let path of exportPaths.databasePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      const snap = await admin.database().ref(pathWithUID).get();

      if (snap.exists()) {
        if (eventChannel) {
          await eventChannel.publish({
            type: `firebase.extensions.export-user-data.v1.database`,
            data: {
              uid,
              pathName: pathWithUID,
            },
          });
        }

        log.rtdbPathExporting(pathWithUID);
        const csv = await constructDatabaseCSV(snap, pathWithUID);
        promises.push(
          uploadCSVToStorage(
            csv,
            storagePrefix,
            pathWithUID,
            ".database.csv"
          ).then(() => {
            log.rtdbPathExported(pathWithUID);
            databaseNodesUploaded++;
          })
        );
      }
    }
  }

  await Promise.all(promises);

  return {
    firestoreCount: firestoreCollectionsUploaded + firestoreDocumentsUploaded,
    databaseCount: databaseNodesUploaded,
  };
}

const uploadCSVToStorage = async (
  csv: string,
  storagePrefix: string,
  path: string,
  extension: string = ".csv"
) => {
  const formattedPath = path.replace(/\//g, "_");
  const storagePath = `${storagePrefix}/${formattedPath}${extension}`;

  const file = admin
    .storage()
    .bucket(config.cloudStorageExportBucket)
    .file(storagePath);

  try {
    await file.save(csv);
  } catch (e) {
    log.exportError(e, path);
  }

  return storagePath;
};
