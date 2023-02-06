/*
 * Copyright 2023 Google LLC
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

import { FieldValue } from "firebase-admin/firestore";
import { getEventarc } from "firebase-admin/eventarc";

import config from "./config";
import * as logs from "./logs";

enum ChangeType {
  DELETE,
  UPDATE,
}

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

logs.init(config);

/** Setup EventArc Channels */
const eventChannel =
  process.env.EVENTARC_CHANNEL &&
  getEventarc().channel(process.env.EVENTARC_CHANNEL, {
    allowedEventTypes: process.env.EXT_SELECTED_EVENTS,
  });

const getChangeType = (
  change: functions.Change<admin.firestore.DocumentSnapshot>
): ChangeType => {
  if (!change.after.exists) {
    return ChangeType.DELETE;
  }
  return ChangeType.UPDATE;
};

const publishEvent = async (leaderboardPath: string) => {
  if (eventChannel) {
    await eventChannel.publish({
      type: `firebase.extensions.firestore-leaderboard.v1.updated`,
      data: {
        documentPaths: leaderboardPath,
      },
    });
  }
};

const updateLeaderboardDocument = async (
  change: functions.Change<admin.firestore.DocumentSnapshot>
): Promise<void> => {
  if (change.before.exists) {
    const scoreBefore = change.before.get(config.scoreFieldName);
    const scoreAfter = change.after.get(config.scoreFieldName);
    if (scoreBefore == scoreAfter) {
      logs.documentUpdateNoScoreChange();
      return Promise.resolve();
    }
  }

  const leaderboardCollectionRef = db
    .collection(config.leaderboardCollectionPath)
    .doc(config.leaderboardName);
  logs.updateLeaderboard(leaderboardCollectionRef.path);

  await db.runTransaction((transaction) => {
    const user_id = change.after.ref.id;
    const entryData = {
      score: change.after.get(config.scoreFieldName),
      user_name: change.after.get(config.userNameFieldName),
    };

    transaction.set(
      leaderboardCollectionRef,
      { [user_id]: entryData },
      { merge: true }
    )

    publishEvent(leaderboardCollectionRef.path);
    logs.updateLeaderboardComplete(leaderboardCollectionRef.path);
    return Promise.resolve();
  });
};

const deleteEntryLeaderboardDocument = async (
  change: functions.Change<admin.firestore.DocumentSnapshot>
): Promise<void> => {
  const leaderboardCollectionRef = db
    .collection(config.leaderboardCollectionPath)
    .doc(config.leaderboardName);
  if (leaderboardCollectionRef == null) {
    logs.emptyLeaderboardDocumentEarlyOut("deleteEntryLeaderboardDocument");
  }
  const user_id = change.after.ref.id;
  logs.deleteEntryInLeaderboard(leaderboardCollectionRef.path, user_id);
  await db.runTransaction((transaction) => {
    leaderboardCollectionRef.update(user_id, FieldValue.delete());
    publishEvent(leaderboardCollectionRef.path);
    logs.deleteEntryInLeaderboardComplete(leaderboardCollectionRef.path, user_id);
    return Promise.resolve();
  });
};

export const onScoreUpdate = functions.handler.firestore.document.onWrite(
  async (change): Promise<void> => {
    logs.start(config);
    const changeType = getChangeType(change);
    try {
      switch (changeType) {
        case ChangeType.UPDATE:
          logs.changeUpdate();
          updateLeaderboardDocument(change);
          break;
        case ChangeType.DELETE:
          logs.changeDelete();
          deleteEntryLeaderboardDocument(change);
          break;
      }

      logs.complete();
    } catch (err) {
      logs.error(err);
    }
  }
);
