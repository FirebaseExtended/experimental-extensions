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
import { Archiver } from "archiver";
import * as sync from "csv-stringify/sync";
import admin from "firebase-admin";
import config from "./config";
// import { File } from "firebase-admin/storage"
type File = any;
const HEADERS = ["TYPE", "path", "data"];

const dataSources = {
  firestore: "FIRESTORE",
  database: "DATABASE",
  storage: "STORAGE",
};

export const constructFirestoreCollectionCSV = (
  snap: FirebaseFirestore.QuerySnapshot,
  collectionPath: string
) => {
  const csvData = snap.docs.map((doc) => {
    const path = `${collectionPath}/${doc.id}`;

    return [dataSources.firestore, path, JSON.stringify(doc.data())];
  });

  csvData.unshift(HEADERS);

  return sync.stringify(csvData);
};

export const constructFirestoreDocumentCSV = (
  snap: FirebaseFirestore.DocumentSnapshot,
  documentPath: string
) => {
  const csvData = [HEADERS];

  const data = snap.data();

  for (let key in data) {
    const path = `${documentPath}/${key}`;
    csvData.push([dataSources.firestore, path, JSON.stringify(data[key])]);
  }

  return sync.stringify(csvData);
};

export const constructDatabaseCSV = async (snap: any, databasePath: string) => {
  const csvData = [HEADERS];

  const data = snap.val();

  for (let key in data) {
    const path = `${databasePath}/${key}`;
    csvData.push([dataSources.database, path, JSON.stringify(data[key])]);
  }

  return sync.stringify(csvData);
};

export const copyFilesToStorage = async (
  pathWithUID: string
): Promise<File> => {
  const originalParts = pathWithUID.split("/");

  const originalBucket =
    originalParts[0] === "{DEFAULT}"
      ? admin.storage().bucket(config.storageBucketDefault)
      : admin.storage().bucket(originalParts[0]);

  const originalPrefix = originalParts.slice(1).join("/");
  const originalFiles = await originalBucket
    .getFiles({ prefix: originalPrefix })
    .then((res) => res[0]);

  const outputBucket = admin.storage().bucket("output-bucket");

  const filePromises = originalFiles.map(async (file) => {
    const newPath = "test";

    const copyResponse = await file.copy(outputBucket.file(newPath));

    return copyResponse[0];
  });
  return filePromises;
};

export async function pushFileToArchive(
  file: File,
  archive: Archiver,
  fileName: string
) {
  try {
    console.log(file);
    const data = await file.download();
    console.log(data);

    const buffer = Buffer.from(data);
    archive.append(buffer, { name: fileName });
  } catch (e) {
    console.log("error", file.name, fileName);
  }
}
