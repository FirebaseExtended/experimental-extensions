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

import { FieldValue } from 'firebase-admin/firestore'

import config from "./config";
import * as logs from "./logs";

enum ChangeType {
  CREATE,
  DELETE,
  UPDATE,
}

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

logs.init(config);

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
    change: functions.Change<admin.firestore.DocumentSnapshot>
  ):Promise<void> => {
    // Read all docs under config.scoreCollectionPath
    console.log(`Start createLeaderboardDocument()`);

    const leaderboardCollectionRef = db.collection(config.leaderboardCollectionPath).doc(config.leaderboardName);

    await db.runTransaction((transaction) => {
      if (leaderboardCollectionRef == null) {
        transaction.create(leaderboardCollectionRef, {});
      }
      const scoreCollectionRef = db.collection(config.scoreCollectionPath);
      scoreCollectionRef.orderBy(config.scoreFieldName, "desc").get().then(querySnapshot => {
        console.log(`querySnapshot size is ${querySnapshot.size}`);
        querySnapshot.forEach(documentSnapshot => {
          console.log(`Found document at ${documentSnapshot.ref.path}, score: ${documentSnapshot.data()[config.scoreFieldName]}`);
          const entryData = {
            score: documentSnapshot.data()[config.scoreFieldName],
            user_name : documentSnapshot.data()[config.userNameFieldName],
          };
          leaderboardCollectionRef.update(
            documentSnapshot.ref.id , entryData
          )
        });
      });
      
    
      return Promise.resolve();
    });
    console.log(`End createLeaderboardDocument()`);
};

const addEntryLeaderboardDocument = async (
  change: functions.Change<admin.firestore.DocumentSnapshot>
):Promise<void> => {
  console.log(`Start addEntryLeaderboardDocument()`);

  const leaderboardCollectionRef = db.collection(config.leaderboardCollectionPath).doc(config.leaderboardName);

  await db.runTransaction((transaction) => {
    if (leaderboardCollectionRef == null) {
      transaction.create(leaderboardCollectionRef, {});
    }
    const entryData = {
      score: change.after.data()[config.scoreFieldName],
      user_name : change.after.data()[config.userNameFieldName],
    };
    leaderboardCollectionRef.update(
      change.after.ref.id , entryData
    )
 
    return Promise.resolve();
  });
  console.log(`End addEntryLeaderboardDocument()`);
};

const deleteEntryLeaderboardDocument = async (
  change: functions.Change<admin.firestore.DocumentSnapshot>
):Promise<void> => {
  console.log(`Start deleteEntryLeaderboardDocument()`);

  const leaderboardCollectionRef = db.collection(config.leaderboardCollectionPath).doc(config.leaderboardName);
  if (leaderboardCollectionRef == null) {
    console.log(`Leaderboard document empty, early out.`);
  }

  await db.runTransaction((transaction) => {
    leaderboardCollectionRef.update(change.before.ref.id, FieldValue.delete());
 
    return Promise.resolve();
  });
  console.log(`End deleteEntryLeaderboardDocument()`);
};

const updateLeaderboardDocument = async (
  change: functions.Change<admin.firestore.DocumentSnapshot>
):Promise<void> => {
  console.log(`Start updateLeaderboardDocument()`);
  const scoreBefore = change.before.data()[config.scoreFieldName];
  const scoreAfter = change.after.data()[config.scoreFieldName]
  if (scoreBefore == scoreAfter) {
    console.log(`Score is same, early out.`);
    return;
  }

  const leaderboardCollectionRef = db.collection(config.leaderboardCollectionPath).doc(config.leaderboardName);

  await db.runTransaction((transaction) => {
    if (leaderboardCollectionRef == null) {
      transaction.create(leaderboardCollectionRef, {});
    }
    
    const entryData = {
      score: change.after.data()[config.scoreFieldName],
      user_name : change.after.data()[config.userNameFieldName],
    };
    leaderboardCollectionRef.update(
      change.after.ref.id , entryData
    )
  
    return Promise.resolve();
  });
  console.log(`End updateLeaderboardDocument()`);
};

export const onScoreUpdate = functions.firestore.document(config.scoreCollectionPath).onWrite(
  async (change): Promise<void> => {
    logs.start(config);

    const changeType = getChangeType(change);

    try {
      switch (changeType) {
        case ChangeType.CREATE:
          logs.changeCreate();
          addEntryLeaderboardDocument(change);
          break;
        case ChangeType.DELETE:
          logs.changeDelete();
          deleteEntryLeaderboardDocument(change);
          break;
        case ChangeType.UPDATE:
          logs.changeUpdate();
          updateLeaderboardDocument(change);
          break;
      }

      //logs.complete();
    } catch (err) {
      //logs.error(err);
    }
  }
);
