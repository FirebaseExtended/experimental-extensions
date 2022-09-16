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
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "localhost:9000";
process.env.PUBSUB_EMULATOR_HOST = "localhost:8085";
process.env.GOOGLE_CLOUD_PROJECT = "demo-experimental";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-experimental" });
}

const extName = "ext-firegraphql-extension-executeQuery";
const url = `http://0.0.0.0:5001/demo-experimental/us-central1/${extName}`;

async function postReq(query: string, variables?: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  return await res.json();
}

describe("FiregraphQL Extension", () => {
  it("returns collection data", async () => {
    const res = await postReq(`query { testsCollection }`);

    expect(res.errors).toBeUndefined();
    expect(res.data.testsCollection.length).toBe(3);

    res.data.testsCollection.forEach((doc: any) => {
      expect(doc.foo).toBeDefined();
      expect(doc.id).toBeDefined();
    });
  });

  it("returns collection data with a custom id", async () => {
    const res = await postReq(`query { testsCollectionWithCustomId }`);

    expect(res.errors).toBeUndefined();
    expect(res.data.testsCollectionWithCustomId.length).toBe(3);

    res.data.testsCollectionWithCustomId.forEach((doc: any) => {
      expect(doc.foo).toBeDefined();
      expect(doc.customId).toBeDefined();
    });
  });

  it("returns a specific document", async () => {
    const res = await postReq(`query { testsDocument(id: "9vg0QuyugnYAtNrxziiP") }`);

    expect(res.errors).toBeUndefined();
    expect(res.data.testsDocument.foo).toBeDefined();
    expect(res.data.testsDocument.id).toBeDefined();
  });
});
