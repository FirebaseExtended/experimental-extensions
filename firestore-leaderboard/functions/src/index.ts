/*
 * Copyright 2022 Google LLC
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

import config from "./config";
import * as logs from "./logs";

enum ChangeType {
  CREATE,
  DELETE,
  UPDATE,
}

// Initialize the Firebase Admin SDK
admin.initializeApp();
logs.init(config);

export const onScoreUpdate = functions.handler.firestore.document.onWrite(
  async (change): Promise<void> => {
    logs.start(config);

    const changeType = getChangeType(change);

    try {
      switch (changeType) {
        case ChangeType.CREATE:
          logs.changeCreate();
          createLeaderboardDocument(change, "leaderboard");
          break;
        case ChangeType.DELETE:
          logs.changeDelete();
          break;
        case ChangeType.UPDATE:
          logs.changeUpdate();
          break;
      }

      //logs.complete();
    } catch (err) {
      //logs.error(err);
    }
  }
);

const getChangeType = (
  change: functions.Change<admin.firestore.DocumentSnapshot>
): ChangeType => {
  if (!change.after.exists) {
    return ChangeType.DELETE;
  }
  if (!change.before.exists) {
    return ChangeType.CREATE;
  }
  return ChangeType.UPDATE;
};

const createLeaderboardDocument = async (
    change: functions.Change<admin.firestore.DocumentSnapshot>,
    docName: string
  ):Promise<void> => {
   // Wrapping in transaction to allow for automatic retries (#48)
    await admin.firestore().runTransaction((transaction) => {
    const docRef = admin.firestore().doc("leaderboard/onehundred")
    transaction.create(docRef,{
      uid: "12345", username: "test1", score: "100"});
    return Promise.resolve();
  });
};