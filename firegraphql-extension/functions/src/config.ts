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

import { FirebaseOptions } from "firebase/app";

export default {
  projectId: process.env.PROJECT_ID,
  location: process.env.LOCATION,
  webAppId: process.env.FIREBASE_WEB_APP_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  schemaPath: process.env.SCHEMA_PATH,
  firebaseOptions: parseFirebaseOptions(process.env.FIREBASE_OPTIONS),
  firestoreEmulator: parseEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST),
  databaseEmulator: parseEmulatorHost(process.env.DATABASE_EMULATOR_HOST),
  storageEmulator: parseEmulatorHost(process.env.STORAGE_EMULATOR_HOST),
};

function parseEmulatorHost(uri: string): { host: string; port: number } | undefined {
  if (!uri) return undefined;
  const url = new URL(uri.startsWith('http') ? uri : `http://${uri}`);
  return { host: url.hostname, port: Number(url.port) };
}

function parseFirebaseOptions(jsonString: string): FirebaseOptions | undefined {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return undefined;
  }
}
