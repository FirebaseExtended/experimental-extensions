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
import waitForExpect from "wait-for-expect";
import { UserRecord } from "firebase-functions/v1/auth";
import {
  createFirebaseUser,
  generateFileInUserStorage,
  resetFirebaseData,
  validateCompleteRecord,
  validateCSVFile,
  validatePendingRecord,
} from "../helpers";
import setupEnvironment from "../helpers/setupEnvironment";
import config from "../../src/config";
import fetch from "node-fetch";
import { fetchFromCustomHook } from "../../src/utils";
import { Response, Headers } from "node-fetch";

const fft = require("firebase-functions-test")();

if (!admin.apps.length) {
  admin.initializeApp();
}

setupEnvironment();
jest.spyOn(admin, "initializeApp").mockImplementation();

import * as funcs from "../../src/index";

/** prepare extension functions */

// const exportUserDatafn = fft.wrap(funcs.exportUserData);

jest.mock("../../src/config", () => ({
  cloudStorageBucketDefault: process.env.STORAGE_BUCKET,
  cloudStorageExportDirectory: "exports",
  firestoreExportsCollection: "exports",
  customHookEndpoint: `http://localhost:1123`,
  zip: false,
}));

jest.mock("../../src/utils", () => {
  const data = { storagePaths: ["{DEFAULT}/test/{UID}.txt"] };

  const response = Promise.resolve({
    ok: true,
    status: 200,
    json: () => data,
    text: () => JSON.stringify(data),
  });

  const original = jest.requireActual("../../src/utils"); // Step 2.
  return {
    ...original,
    fetchFromCustomHook: () => response,
  };
});

describe("extension", () => {
  describe("custom hooks", () => {
    let user: UserRecord;
    let unsubscribe;

    beforeEach(async () => {
      await resetFirebaseData(user);
      user = await createFirebaseUser();
    });

    afterEach(async () => {
      jest.clearAllMocks();
      // await resetFirebaseData(user);
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    });

    test("can export from storage based on custom hook, to a csv", async () => {
      await generateFileInUserStorage(user.uid, "Hello World!");

      const exportUserDatafn = fft.wrap(funcs.exportUserData);
      console.log("USER", user.uid);

      // // // watch the exports collection for changes
      const coll = admin
        .firestore()
        .collection(config.firestoreExportsCollection);

      const observer = jest.fn();
      unsubscribe = coll.onSnapshot(observer);

      const { exportId } = await exportUserDatafn.call(
        {},
        { uid: user.uid },
        { auth: { uid: user.uid } }
      );

      // // // expect exportId to be defined and to be a string
      expect(exportId).toBeDefined();
      expect(typeof exportId).toBe("string");
      //wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // // // wait for the record to have been updated

      await waitForExpect(async () => {
        expect(await coll.get().then((s) => s.docs.map((d) => d.id))).toContain(
          exportId
        );
      });

      // // // wait for the record to have been updated
      await waitForExpect(async () => {
        expect(observer.mock.calls.length).toBeGreaterThanOrEqual(2);
      });

      const pendingRecordData = observer.mock.calls[1][0].docs[0].data();
      validatePendingRecord(pendingRecordData, { user });

      const completeRecordData = observer.mock.calls[2][0].docs[0].data();
      validateCompleteRecord(completeRecordData, {
        user,
        exportId,
        config,
        shouldZip: false,
      });

      const bucket = admin.storage().bucket(config.cloudStorageBucketDefault);

      const [files] = await bucket.getFiles({
        prefix: config.cloudStorageExportDirectory,
      });

      // // expect 1 file to be exported
      expect(files.length).toBe(1);
      const file = files[0];

      const fileName = file.name;
      const parts = fileName.split("/");
      // // should be in the exports directory
      expect(parts[0]).toBe(config.cloudStorageExportDirectory);
      // // should be in the export directory
      expect(parts[1]).toBe(exportId);
      // // should have the user id as the name and have the .firestore.csv extension
      // // should have the correct content
      const downloadResponse = await file.download();

      const content = downloadResponse[0].toString();

      expect(content).toBe("Hello World!");
    });
  });
});
