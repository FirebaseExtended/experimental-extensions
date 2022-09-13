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

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FirebaseApolloFunction, makeExecutableSchema } from "firegraphql";
import config from "./config";

const app = admin.initializeApp();

let server: FirebaseApolloFunction;

export const handler = functions.handler.https.onRequest(async (req, res) => {
  if (!server) {
    // TODO: Get the schema from Storage or Firestore.
    //       Requires extension params (document path / file reference)

    // TODO: Get the Firebase Options somehow - we can probably infer most of them from the project ID (see below),
    //       however, the API Key is required for Firestore, which can be claimed via the google apis (https://firebase.google.com/docs/projects/api/reference/rest/v1beta1/projects.webApps/getConfig),
    //       but this required knowledge of an App ID to be provided by the user. Need to verify whether this is acceptable or if theres another way.

    const schema = makeExecutableSchema({
      typeDefs: `
      type Test {
        foo: String!
      }

      type Query {
        testing: [Test]! @firestoreQuery(collection: "tests", idField: "lolol")
      }
      `,
    });

    server = new FirebaseApolloFunction(schema, {
      firebaseAdminAppInstance: app,
      firebaseOptions: {
        apiKey: "AIzaSyD6BMzm6VxjlpmJ6WU18uX3klJq6oYwyKs",
        authDomain: `${config.projectId}.firebaseapp.com`,
        databaseURL: `https://${config.projectId}-default-rtdb.${
          config.location
        }.firebasedatabase.app`,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
      },
    });
  }

  return server.createHandler()(req, res);
});