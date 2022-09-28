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
  createFirebaseUser,
  generateUserCollection,
  generateUserDocument,
} from "./helpers";
import setupEnvironment from "./helpers/setupEnvironment";
import * as funcs from "../src/index";

const fft = require("firebase-functions-test")();

if (!admin.apps.length) {
  admin.initializeApp();
}

setupEnvironment();

/** prepare extension functions */
const exportUserDatafn = fft.wrap(funcs.exportUserData);

describe("extension", () => {
  describe("top level collection", () => {
    let user: UserRecord;

    beforeEach(async () => {
      user = await createFirebaseUser();
    });

    test("can export a top level collection with an id of {userId}", async () => {
      /** Create a top level collection with a single document */
      await generateUserCollection(user.uid, 1);

      await exportUserDatafn.call(
        {},
        { uid: user.uid },
        { auth: { uid: user.uid } }
      );
    });

    test("can export a top level document with an id of {userId}", async () => {
      /** Create a top level document with a single document */
      await generateUserDocument(user.uid, { "single document": "example" });

      await exportUserDatafn.call(
        {},
        { uid: user.uid },
        { auth: { uid: user.uid } }
      );
    });
  });
});
