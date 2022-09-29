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
import { FieldValue } from "firebase-admin/firestore";
import * as functions from "firebase-functions";
import config from "./config";
import {
  constructDatabaseCSV,
  constructFirestoreCollectionCSV,
  constructFirestoreDocumentCSV,
} from "./construct_exports";
import { ExportPaths, getExportPaths } from "./get_export_paths";
import archiver, { Archiver } from "archiver";
import * as log from "./logs";

// Initialize the Firebase Admin SDK
admin.initializeApp({
  databaseURL: config.databaseLocation,
});

export const exportUserData = functions.https.onCall(async (_data, context) => {
  // TODO get from call
  const uid = "123";
  // const uid = context.auth.uid;

  const exportId = await initializeExport(uid);

  const exportPaths = await getExportPaths(uid);

  if (config.zip) {
    try {
      await archiveFilesAsZip(exportPaths, uid, exportId);
    } catch (e) {
      log.exportError(e);
    }
  } else {
    await exportAsCSVs(exportPaths, uid, exportId);
  }

  await finalizeExport(uid, exportId);

  return { exportId };
});

const initializeExport = async (uid: string) => {
  const startedAt = FieldValue.serverTimestamp();

  log.startExport(uid);

  const exportDoc = await admin.firestore().collection("exports").add({
    uid,
    status: "pending",
    started_at: startedAt,
  });

  return exportDoc.id;
};

const finalizeExport = async (uid: string, exportId: string) => {
  await admin
    .firestore()
    .doc(`exports/${exportId}`)
    .update({
      status: "complete",
      storagePath: `${config.storageExportDirectory}/${uid}/${exportId}${
        config.zip ? ".zip" : ""
      }`,
    });
  log.completeExport(uid);
};

async function exportAsCSVs(
  exportPaths: ExportPaths,
  uid: string,
  exportId: string
) {
  const promises = [];

  for (let path of exportPaths.firestorePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      if (pathWithUID.split("/").length % 2 === 1) {
        const snap = await admin.firestore().collection(pathWithUID).get();

        if (!snap.empty) {
          log.firestorePathExporting(pathWithUID);

          const csv = await constructFirestoreCollectionCSV(snap, pathWithUID);

          promises.push(
            uploadCSVToStorage(
              csv,
              uid,
              exportId,
              pathWithUID,
              ".firestore.csv"
            ).then(() => {
              log.firestorePathExported(pathWithUID);
            })
          );
        }
      } else {
        const doc = await admin.firestore().doc(pathWithUID).get();
        const csv = await constructFirestoreDocumentCSV(doc, pathWithUID);
        promises.push(
          uploadCSVToStorage(csv, uid, exportId, pathWithUID, ".firestore.csv")
        );
      }
    }
  }

  for (let path of exportPaths.databasePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      const snap = await admin.database().ref(pathWithUID).get();
      if (snap.exists()) {
        log.rtdbPathExporting(pathWithUID);
        const csv = await constructDatabaseCSV(snap, pathWithUID);
        promises.push(
          uploadCSVToStorage(
            csv,
            uid,
            exportId,
            pathWithUID,
            ".database.csv"
          ).then(() => {
            log.rtdbPathExported(pathWithUID);
          })
        );
      }
    }
  }

  return Promise.all(promises);
}

const uploadCSVToStorage = async (
  csv: string,
  uid: string,
  exportId: string,
  path: string,
  extension: string = ".csv"
) => {
  const formattedPath = path.replace(/\//g, "_");
  const storagePath = `${config.storageExportDirectory}/${uid}/${exportId}/${formattedPath}${extension}`;

  const file = admin.storage().bucket(config.storageBucket).file(storagePath);

  try {
    await file.save(csv);
  } catch (e) {
    log.exportError(e, path);
  }

  return storagePath;
};

async function archiveFilesAsZip(
  exportPaths: ExportPaths,
  uid: string,
  exportId: string
) {
  return new Promise<void>(async (resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    archive.on("error", reject);

    const storagePath = `${config.storageExportDirectory}/${uid}/${exportId}.zip`;

    const stream = admin
      .storage()
      .bucket(config.storageBucket)
      .file(storagePath)
      .createWriteStream();

    archive.pipe(stream);

    await appendToArchive(archive, exportPaths, uid);

    await archive.finalize();
    resolve();
  });
}

async function appendToArchive(
  archive: Archiver,
  exportPaths: ExportPaths,
  uid: string
) {
  for (let path of exportPaths.firestorePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);

      log.firestorePathExporting(pathWithUID);

      if (pathWithUID.split("/").length % 2 === 1) {
        const snap = await admin.firestore().collection(pathWithUID).get();
        if (!snap.empty) {
          const csv = await constructFirestoreCollectionCSV(snap, path);
          const buffer = Buffer.from(csv);
          archive.append(buffer, { name: `${pathWithUID}.firestore.csv` });
        }
      } else {
        const snap = await admin.firestore().doc(pathWithUID).get();

        if (snap.exists) {
          const csv = await constructFirestoreDocumentCSV(snap, pathWithUID);
          const buffer = Buffer.from(csv);
          archive.append(buffer, { name: `${pathWithUID}.firestore.csv` });
        }
      }
    } else {
      log.firestorePathNotString();
    }
  }

  for (let path of exportPaths.databasePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      const snap = await admin.database().ref(pathWithUID).get();

      if (snap.exists()) {
        const csv = await constructDatabaseCSV(snap, pathWithUID);
        const buffer = Buffer.from(csv);
        archive.append(buffer, { name: `${pathWithUID}.database.csv` });
      }
    } else {
      log.rtdbPathNotString();
    }
  }
}

function replaceUID(path: string, uid: string) {
  return path.replace(/{UID}/g, uid);
}
