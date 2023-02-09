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
  // Check if the change from user doc is related to score update and if the new score is higher than the previous one.
  if (change.before.exists) {
    const scoreBefore = change.before.get(config.scoreFieldName);
    const scoreAfter = change.after.get(config.scoreFieldName);
    if (scoreBefore >= scoreAfter) {
      logs.documentUpdateNoScoreChange();
      return Promise.resolve();
    }
  }

  const user_id = change.after.ref.id;
  const newEntryData = {
    [config.scoreFieldName]: change.after.get(config.scoreFieldName),
    [config.userNameFieldName]: change.after.get(config.userNameFieldName),
  };
  const newScore = parseInt(newEntryData[config.scoreFieldName], 10);

  const leaderboardCollectionRef = db
    .collection(config.leaderboardCollectionPath)
    .doc(config.leaderboardName);

  // Pre check multiple conditions before we decide to add the new entry.
  const leaderboardSnap = await leaderboardCollectionRef.get();
  const configLeaderboardSize = parseInt(config.leaderboardSize, 10);
  var lowestScoreEntryUserId = "";
  if (leaderboardSnap.exists) {
    const leaderboardData = leaderboardSnap.data();
    const existUserData = leaderboardData[user_id];
    if (existUserData != null) {
      var existScore = parseInt(
        leaderboardData[user_id][config.scoreFieldName],
        10
      );

      if (existScore >= newScore) {
        // Same user has lower score than leaderboard record, no need to update leaderboard, early out.
        logs.sameUserLowerScore(
          user_id,
          leaderboardData[user_id][config.scoreFieldName],
          newEntryData[config.scoreFieldName]
        );
        return Promise.resolve();
      }
    } else {
      const leaderboardSize = Object.entries(leaderboardData).length;
      logs.comparingLeaderboardSize(leaderboardSize, configLeaderboardSize);
      if (leaderboardSize >= configLeaderboardSize) {
        // leaderboard already reached the max size, need to check add this new entry or replace with the lowest score entry.

        var minScore = Number.MAX_VALUE;
        var minScoreUserId = "";

        for (const [key, value] of Object.entries(leaderboardData)) {
          var scoreToCheck = parseInt(value[config.scoreFieldName], 10);
          if (scoreToCheck < minScore) {
            minScore = scoreToCheck;
            minScoreUserId = key;
          }
        }

        if (minScore < newScore) {
          logs.findMinScoreEntryToDelete(lowestScoreEntryUserId, minScore);
          lowestScoreEntryUserId = minScoreUserId;
        } else {
          // new entry's score is lower than min score in the leaderboard, early out.
          logs.newEntryScoreLower(newScore, minScore);
          return Promise.resolve();
        }
      }
    }
  }

  await db.runTransaction((transaction) => {
    if (lowestScoreEntryUserId != "") {
      // Found the lowest score entry to delete from the leaderboard.
      logs.deleteEntryInLeaderboard(
        leaderboardCollectionRef.path,
        lowestScoreEntryUserId
      );
      transaction.update(leaderboardCollectionRef, {
        [lowestScoreEntryUserId]: FieldValue.delete(),
      });
    }
    logs.updateLeaderboard(leaderboardCollectionRef.path, user_id);
    transaction.set(
      leaderboardCollectionRef,
      { [user_id]: newEntryData },
      { merge: true }
    );

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
    logs.deleteEntryInLeaderboardComplete(
      leaderboardCollectionRef.path,
      user_id
    );
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
