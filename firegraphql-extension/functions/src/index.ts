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

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { FirebaseApolloFunction, makeExecutableSchema } from "firegraphql";

import config from "./config";
import * as logs from "./logs";

import { FirebaseOptions } from "firebase/app";
import { getWebConfigByAppId, getWebConfigByList } from "./api";

const app = admin.initializeApp();
let server: FirebaseApolloFunction;

logs.init();

export const executeQuery = functions.handler.https.onRequest(
  async (req, res) => {
    if (!server) {
      let firebaseOptions: FirebaseOptions;
      let typeDef: string;

      try {
        if (config.webAppId) {
          firebaseOptions = await getWebConfigByAppId(config.webAppId);
        } else {
          firebaseOptions = await getWebConfigByList();
        }
      } catch (e) {
        logs.webConfigError(e);
        return;
      }

      try {
        typeDef = await downloadSchema();
      } catch (e) {
        logs.downloadSchemaError(e);
        return;
      }

      server = new FirebaseApolloFunction(
        makeExecutableSchema({
          typeDefs: [typeDef],
        }),
        {
          firebaseAdminAppInstance: app,
          firebaseOptions,
        }
      );
    }

    return server.createHandler()(req, res);
  }
);

// Downloads a file from the storage bucket at the provided ref.
async function downloadSchema(): Promise<string> {
  const download = await app
    .storage()
    .bucket(config.storageBucket)
    .file(config.schemaPath)
    .download({
      // https://github.com/googleapis/google-cloud-node/issues/654#issuecomment-987123067
      validation: !process.env.FUNCTIONS_EMULATOR,
    });

  return download.toString();
}
