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

import admin from "firebase-admin";
import config from "./config";

export const replaceUID = (path: string, uid: string) =>
  path.replace(/{UID}/g, uid);

export const getDatabaseUrl = (
  selectedDatabaseInstance: string | undefined,
  selectedDatabaseLocation: string | undefined
) => {
  if (!selectedDatabaseLocation || !selectedDatabaseInstance) return null;

  if (selectedDatabaseLocation === "us-central1")
    return `https://${selectedDatabaseInstance}.firebaseio.com`;

  return `https://${selectedDatabaseInstance}.${selectedDatabaseLocation}.firebasedatabase.app`;
};

export const getFilesFromStoragePath = async (path: string) => {
  const parts = path.split("/");
  const bucketName = parts[0];
  const bucket =
    bucketName === "{DEFAULT}"
      ? admin.storage().bucket(config.storageBucketDefault)
      : admin.storage().bucket(bucketName);

  const prefix = parts.slice(1).join("/");
  const files = await bucket.getFiles({ prefix });

  return files;
};
