/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as admin from "firebase-admin";
import fetch from "node-fetch";

process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199";
process.env.PUBSUB_EMULATOR_HOST = "localhost:8085";
process.env.GOOGLE_CLOUD_PROJECT = "demo-experimental";
process.env.TESTING = "true";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-experimental" });
}

const extName = "ext-firegraphql-extension-executeQuery";
const url = `http://localhost:3001/demo-experimental/us-central1/${extName}`;

function postReq(query: string, variables?: any) {
  console.log(url);
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
}

describe("foo", () => {
  it("does something", async () => {
    const res = await postReq(`query { testsCollection }`);
    console.log(res.data);
    // Mock example
    // add a valid schema to storage: firebase emulators:start --project=demo-experimental --import=./import --export-on-exit=./import
    //
    console.log("ok!");
  });
});
