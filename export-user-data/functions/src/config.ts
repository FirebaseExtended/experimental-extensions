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

export default {
  storageBucket: process.env.STORAGE_BUCKET,
  cloudStorageExportDirectory: process.env.CLOUD_STORAGE_EXPORT_DIRECTORY,
  firestorePaths: process.env.FIRESTORE_PATHS,
  databasePaths: process.env.RTDB_PATHS,
  storagePaths: process.env.STORAGE_PATHS,
  selectedDatabaseLocation: process.env.SELECTED_DATABASE_LOCATION,
  selectedDatabaseInstance:
    process.env.SELECTED_DATABASE_INSTANCE || process.env.DATABASE_URL,
  customHookEndpoint: process.env.CUSTOM_HOOK_ENDPOINT,
  zip: process.env.ZIP === "true",
};
