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

export const copyFileToStorage = async (
  originalBucket,
  originalStoragePath
) => {
  const originalExtension = originalStoragePath.split(".").pop();

  const newPath = `exports/<uuidv5>.${originalExtension}`;
  const fullPath = `gs://${originalBucket}/${originalStoragePath}`;

  return admin
    .storage()
    .bucket(originalBucket)
    .file(originalStoragePath)
    .copy(admin.storage().bucket().file(newPath), {
      metadata: {
        customMetadata: {
          originalFileLocation: fullPath,
        },
      },
    })
    .then((copyResponse) => copyResponse[0]);
};

export async function pushFileToArchive(
  file: File,
  archive: Archiver,
  fileName: string
) {
  const data = await file.read();
  const buffer = Buffer.from(data);
  archive.append(buffer, { name: fileName });
}
