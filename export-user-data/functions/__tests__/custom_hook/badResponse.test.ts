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
  resetFirebaseData,
  validateCompleteRecord,
  validateCSVFile,
  validatePendingRecord,
} from "../helpers";
import setupEnvironment from "../helpers/setupEnvironment";
import config from "../../src/config";
import { fetchFromCustomHook } from "../../src/utils";

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
  const data = "asdas akksfd";

  const response = Promise.resolve({
    ok: true,
    status: 200,
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
      await resetFirebaseData();
      user = await createFirebaseUser();
    });

    afterEach(async () => {
      jest.clearAllMocks();
      await resetFirebaseData(user);
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    });

    xtest("should skip on bad response from hook", async () => {
      /** Create a top level collection with a single document */
      const ref = await admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("comments")
        .add({ content: "hello world" });

      /** Create a subcollection with a single document */

      const commentId = ref.id;

      const exportUserDatafn = fft.wrap(funcs.exportUserData);

      // // // watch the exports collection for changes
      const observer = jest.fn();
      unsubscribe = admin
        .firestore()
        .collection(config.firestoreExportsCollection)
        .onSnapshot(observer);

      const { exportId } = await exportUserDatafn.call(
        {},
        { uid: user.uid },
        { auth: { uid: user.uid } }
      );

      // // // expect exportId to be defined and to be a string
      expect(exportId).toBeDefined();
      expect(typeof exportId).toBe("string");

      // // // wait for the record to have been updated
      await waitForExpect(() => {
        expect(observer).toHaveBeenCalledTimes(2);
      });

      // // /** expect firestore to have a record of the export */

      // // // should be pending
      const pendingRecordData = observer.mock.calls[0][0].docs[0].data();
      validatePendingRecord(pendingRecordData, { user });

      const completeRecordData = observer.mock.calls[1][0].docs[0].data();
      validateCompleteRecord(completeRecordData, {
        user,
        exportId,
        config,
        shouldZip: false,
      });

      // /** Check that the document was exported correctly */

      const bucket = admin.storage().bucket(config.cloudStorageBucketDefault);
      const [files] = await bucket.getFiles();

      // // // expect 1 file to be exported
      expect(files.length).toBe(1);

      const file = files[0];
      const expectedFileName = `users_${user.uid}_comments.firestore.csv`;
      const expectedCSVData = [
        [
          "FIRESTORE",
          `users/${user.uid}/comments/${commentId}`,
          // TODO: why so many quotation marks?
          '"{""content"":""hello world""}"',
        ],
      ];
      await validateCSVFile(file, {
        config,
        exportId,
        expectedFileName,
        expectedCSVData,
      });
    });
  });
});
