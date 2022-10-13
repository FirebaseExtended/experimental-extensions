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
  clearFirestore,
  clearStorage,
  createFirebaseUser,
  generateDatabaseNode,
  resetFirebaseData,
  validateCompleteRecord,
  validateCSVFile,
  validatePendingRecord,
} from "../helpers";
import setupEnvironment from "../helpers/setupEnvironment";

import config from "../../src/config";

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
  databasePaths: "{UID}",
  zip: false,
}));

describe("extension", () => {
  describe("top level node", () => {
    let user: UserRecord;
    let unsubscribe;

    beforeEach(async () => {
      await resetFirebaseData();
      user = await createFirebaseUser();
    });

    afterEach(async () => {
      jest.clearAllMocks();
      await resetFirebaseData();
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    });

    test("can export a csv of a top level database node with an id of {userId}", async () => {
      /** Create a top level collection with a single document */

      const ref = await generateDatabaseNode({ foo: "bar" }, user.uid);
      const exportUserDatafn = fft.wrap(funcs.exportUserData);

      // watch the exports collection for changes
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
      // // expect exportId to be defined and to be a string
      expect(exportId).toBeDefined();
      expect(typeof exportId).toBe("string");

      // wait for the record to have been updated
      await waitForExpect(() => {
        expect(observer).toHaveBeenCalledTimes(3);
      });
      // // expect firestore to have a record of the export
      const pendingRecordData = observer.mock.calls[1][0].docs[0].data();

      validatePendingRecord(pendingRecordData, { user });

      const completeRecordData = observer.mock.calls[2][0].docs[0].data();

      validateCompleteRecord(completeRecordData, {
        user,
        exportId,
        config,
        shouldZip: false,
      });

      // /** Check that the document was exported correctly */

      const bucket = admin.storage().bucket(config.cloudStorageBucketDefault);
      const [files] = await bucket.getFiles();

      // // expect 1 file to be exported
      expect(files.length).toBe(1);

      const file = files[0];
      const expectedFileName = `${user.uid}.database.csv`;
      const expectedCSVData = [
        [
          "DATABASE",
          `${user.uid}/${ref.key}`,
          // TODO: why so many quotation marks?
          '"{""foo"":""bar""}"',
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
