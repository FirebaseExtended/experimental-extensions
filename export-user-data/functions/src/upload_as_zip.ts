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

import archiver, { Archiver } from "archiver";
import { ExportPaths } from "./get_export_paths";
import config from "./config";
import * as log from "./logs";
import admin from "firebase-admin";
import {
  constructDatabaseCSV,
  constructFirestoreCollectionCSV,
  constructFirestoreDocumentCSV,
  pushFileToArchive,
} from "./construct_exports";
import { replaceUID } from "./utils";
import { eventChannel } from ".";
import { File } from "@google-cloud/storage";

interface UploadAsZipParams {
  exportPaths: ExportPaths;
  storagePrefix: string;
  uid: string;
  exportId: string;
  filesToZip: File[];
}

export async function uploadDataAsZip({
  exportPaths,
  storagePrefix,
  uid,
  exportId,
  filesToZip,
}: UploadAsZipParams) {
  return new Promise<void>(async (resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    archive.on("error", reject);

    const storagePath = `${storagePrefix}/${exportId}_${uid}.zip`;

    const stream = admin
      .storage()
      .bucket(config.storageBucketDefault)
      .file(storagePath)
      .createWriteStream();

    archive.pipe(stream);
    await appendToArchive({ archive, exportPaths, uid, filesToZip });

    await archive.finalize();
    resolve();
  });
}

interface AppendToArchiveParams {
  archive: Archiver;
  exportPaths: ExportPaths;
  uid: string;
  filesToZip: File[];
}

async function appendToArchive({
  archive,
  exportPaths,
  uid,
  filesToZip,
}: AppendToArchiveParams) {
  const promises = [];

  for (let path of exportPaths.firestorePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      // If it's a path to a collection
      if (pathWithUID.split("/").length % 2 === 1) {
        promises.push(
          appendFirestoreCollectionToArchive(archive, pathWithUID, uid)
        );
        // else it is a path to a document
      } else {
        promises.push(
          appendFirestoreDocumentToArchive(archive, pathWithUID, uid)
        );
      }
    } else {
      log.firestorePathNotString();
    }
  }

  for (let path of exportPaths.databasePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      promises.push(appendDatabaseNodeToArchive(archive, pathWithUID, uid));
    } else {
      log.rtdbPathNotString();
    }
  }
  for (let file of filesToZip) {
    promises.push(pushFileToArchive(file, archive));
  }

  return Promise.all(promises);
}

async function appendFirestoreCollectionToArchive(
  archive: Archiver,
  path: string,
  uid: string
) {
  log.firestorePathExporting(path);

  const snap = await admin.firestore().collection(path).get();

  if (!snap.empty) {
    if (eventChannel) {
      await eventChannel.publish({
        type: `firebase.extensions.export-user-data.firestore`,
        data: JSON.stringify({
          uid,
          pathName: path,
        }),
      });
    }
    const csv = constructFirestoreCollectionCSV(snap, path);
    const buffer = Buffer.from(csv);
    archive.append(buffer, { name: `${path}.firestore.csv` });
  }
}

async function appendFirestoreDocumentToArchive(
  archive: Archiver,
  path: string,
  uid: string
) {
  log.firestorePathExporting(path);

  const snap = await admin.firestore().doc(path).get();

  if (snap.exists) {
    if (eventChannel) {
      await eventChannel.publish({
        type: `firebase.extensions.export-user-data.firestore`,
        data: JSON.stringify({
          uid,
          pathName: path,
        }),
      });
    }
    const csv = constructFirestoreDocumentCSV(snap, path);
    const buffer = Buffer.from(csv);
    archive.append(buffer, { name: `${path}.firestore.csv` });
  }
}

async function appendDatabaseNodeToArchive(
  archive: Archiver,
  path: string,
  uid: string
) {
  log.rtdbPathExporting(path);

  const snap = await admin.database().ref(path).get();

  if (snap.exists()) {
    if (eventChannel) {
      await eventChannel.publish({
        type: `firebase.extensions.export-user-data.database`,
        data: JSON.stringify({
          uid,
          pathName: path,
        }),
      });
    }
    const csv = await constructDatabaseCSV(snap, path);
    const buffer = Buffer.from(csv);
    archive.append(buffer, { name: `${path}.database.csv` });
  }
}
