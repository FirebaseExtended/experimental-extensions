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
import unzip from "unzipper";
import waitForExpect from "wait-for-expect";
import { UserRecord } from "firebase-functions/v1/auth";
import {
  createFirebaseUser,
  generateFileInUserStorage,
  resetFirebaseData,
  validateCompleteRecord,
  validatePendingRecord,
  validateZippedExport,
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
  storagePaths: "{DEFAULT}",
  zip: true,
}));

describe("extension", () => {
  describe("top level storage file", () => {
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

    test("Can zip a top level file to storage export directory from storage", async () => {
      /** Create a top level collection with a single document */

      await generateFileInUserStorage(user.uid, "Hello World!");
      const exportUserDatafn = fft.wrap(funcs.exportUserData);

      // // watch the exports collection for changes
      const observer = jest.fn();

      const unsubscribe = admin
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

      await waitForExpect(() => {
        expect(observer).toHaveBeenCalledTimes(3);
      });

      const pendingRecordData = observer.mock.calls[1][0].docs[0].data();
      validatePendingRecord(pendingRecordData, { user });

      const completeRecordData = observer.mock.calls[2][0].docs[0].data();
      validateCompleteRecord(completeRecordData, {
        user,
        config,
        exportId,
        shouldZip: true,
      });

      // /** Check that the document was exported correctly */

      const bucket = admin.storage().bucket(config.cloudStorageBucketDefault);

      const [files] = await bucket.getFiles({
        prefix: config.cloudStorageExportDirectory,
      });

      // // expect 1 file to be exported
      expect(files.length).toBe(2);

      const zipFile = files.find((file) => file.name.includes("export.zip"));

      await validateZippedExport(zipFile, {
        config,
        exportId,
        contentType: "text",
        expectedData: "Hello World!",
      });
      // expect(zipFile).toBeDefined();
      // // should have the user id as the name and have the .firestore.csv extension
      // // should have the correct content
      const downloadResponse = await zipFile.download();
      const unzipped = await unzip.Open.buffer(downloadResponse[0]);
      const unzippedFiles = unzipped.files;
      // // should have 1 file
      expect(unzippedFiles.length).toBe(1);
      // // should have 1 file
      const content = (await unzippedFiles[0].buffer()).toString();

      expect(content).toBe("Hello World!");
      unsubscribe();
    });
  });
});
