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

// export default {
//   storageBucket: process.env.STORAGE_BUCKET,
//   storageExportDirectory: process.env.STORAGE_EXPORT_DIRECTORY,
//   firestorePaths: process.env.FIRESTORE_PATHS,
//   databasePaths: process.env.DATABASE_PATHS,
//   databaseLocation: process.env.DATABASE_LOCATION,
//   customHookEndpoint: process.env.CUSTOM_HOOK_ENDPOINT,
// };

export default {
  storageBucket: "storage-bucket",
  storageExportDirectory: "storage-export-dir",
  firestorePaths: "users/{UID}/comments,posts/{UID}",
  databasePaths: "users/{UID},posts/{UID}",
  databaseLocation:
    process.env.DATABASE_LOCATION ||
    "http://localhost:9000/?ns=extensions-testing",
  customHookEndpoint: process.env.CUSTOM_HOOK_ENDPOINT || "",
};