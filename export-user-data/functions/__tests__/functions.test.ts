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
import { UserRecord } from "firebase-functions/v1/auth";
import {
  clearFirestore,
  createFirebaseUser,
  generateFileInUserStorage,
  generateUserCollection,
  generateUserDocument,
} from "./helpers";
import setupEnvironment from "./helpers/setupEnvironment";

import config from "../src/config";

const fft = require("firebase-functions-test")();

if (!admin.apps.length) {
  admin.initializeApp();
}

setupEnvironment();

jest.spyOn(admin, "initializeApp").mockImplementation();

import * as funcs from "../src/index";

/** prepare extension functions */

// const exportUserDatafn = fft.wrap(funcs.exportUserData);

jest.mock("../src/config", () => ({
  storageBucketDefault: process.env.STORAGE_BUCKET,
  cloudStorageExportDirectory: "exports",
  firestoreExportsCollection: "exports",
  firestorePaths: "{UID}",
  zip: false,
}));

describe("extension", () => {
  describe("top level collection", () => {
    let user: UserRecord;

    beforeEach(async () => {
      user = await createFirebaseUser();
    });

    afterEach(async () => {
      jest.clearAllMocks();
      // await clearFirestore();
    });

    xtest("can export a top level collection with an id of {userId}", async () => {
      /** Create a top level collection with a single document */

      await generateUserCollection(user.uid, 1);
      const exportUserDatafn = fft.wrap(funcs.exportUserData);

      await exportUserDatafn.call(
        {},
        { uid: user.uid },
        { auth: { uid: user.uid } }
      );
    });

    // xtest("can export a top level document with an id of {userId}", async () => {
    //   /** Create a top level document with a single document */

    //   //generate a file in default bucket, called uid.
    //   const file = await generateFileInUserStorage(user.uid, "Hello World!");

    //   // call extension function
    //   await exportUserDatafn.call(
    //     {},
    //     { uid: user.uid },
    //     { auth: { uid: user.uid } }
    //   );

    //   // expect there to be a file in the export bucket with the same name as the uid
    //   // const exportBucket = admin.storage().bucket();

    //   // const [files] = await exportBucket.getFiles({ prefix: 'exports' });
    //   // console.log(files.map(f => f.name))

    //   // expect(files.length).toBe(1);
    //   // expect(files[0].name).toBe(user.uid);
    // });
  });
});
