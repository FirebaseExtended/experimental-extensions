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
  generateFileInUserStorage,
  generateUserCollection,
  generateUserDocument,
  waitForDocumentUpdate,
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
  storageBucketDefault: process.env.STORAGE_BUCKET,
  cloudStorageExportDirectory: "exports",
  firestoreExportsCollection: "exports",
  storagePaths: "{DEFAULT}",
  zip: false,
}));

describe("extension", () => {
  describe("top level storage file", () => {
    let user: UserRecord;

    beforeEach(async () => {
      user = await createFirebaseUser();
      await clearFirestore();
      await clearStorage();
    });

    afterEach(async () => {
      jest.clearAllMocks();
      // await clearFirestore();
      // await clearStorage();
      await admin.auth().revokeRefreshTokens(user.uid);
    });

    test("Can copy a top level file to storage export directory from storage", async () => {
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
      // const data = await waitForDocumentUpdate(admin.firestore().collection(config.firestoreExportsCollection).doc(exportId));

      // console.log(data.data());
      // // expect exportId to be defined and to be a string
      expect(exportId).toBeDefined();
      expect(typeof exportId).toBe("string");

      await waitForExpect(() => {
        expect(observer).toHaveBeenCalledTimes(3);
      });
      // // expect firestore to have a record of the export
      const pendingRecordData = observer.mock.calls[1][0].docs[0].data();
      const completeRecordData = observer.mock.calls[2][0].docs[0].data();

      // // should be pending
      expect(pendingRecordData.status).toBe("pending");
      expect(pendingRecordData.uid).toBe(user.uid);
      // // should be a server timestamp
      expect(pendingRecordData.startedAt).toHaveProperty("_nanoseconds");
      expect(pendingRecordData.startedAt).toHaveProperty("_seconds");

      // // should be success
      expect(completeRecordData.status).toBe("complete");
      expect(completeRecordData.uid).toBe(user.uid);
      // // should be a server timestamp
      expect(completeRecordData.startedAt).toHaveProperty("_nanoseconds");
      expect(completeRecordData.startedAt).toHaveProperty("_seconds");

      // // should have a null zipPath
      expect(completeRecordData.zipPath).toBeNull();

      // // should have the right number of files exported
      expect(completeRecordData.exportedFileCount).toBe(1);

      // // should have a string storage path
      expect(completeRecordData.storagePath).toBeDefined();
      expect(typeof completeRecordData.storagePath).toBe("string");

      const recordedStoragePath = completeRecordData.storagePath;
      const recordedStoragePathParts = recordedStoragePath.split("/");

      // // should have a record of the correct path to the export in storage
      expect(recordedStoragePathParts[0]).toBe(
        config.firestoreExportsCollection
      );
      expect(recordedStoragePathParts[1]).toBe(exportId);

      // /** Check that the document was exported correctly */

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
      // unsubscribe();
    });
  });
});

import { Query, DocumentData } from "@google-cloud/firestore";

export const waitForDocumentToExistInCollection = (
  query: Query,
  field: string | number,
  value: any,
  timeout: number = 10_000
): Promise<DocumentData> => {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      reject(
        new Error(
          `Timeout waiting for firestore document to exist with field ${field} in collection`
        )
      );
    }, timeout);

    const unsubscribe = query.onSnapshot(async (snapshot) => {
      const docs = snapshot.docChanges();

      const record: DocumentData = docs.filter(
        ($) => $.doc.data()[field] === value
      )[0];

      if (record) {
        unsubscribe();
        if (!timedOut) {
          clearTimeout(timer);
          resolve(record);
        }
      }
    });
  });
};
