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
import { UserRecord } from "firebase-admin/auth";

enum ChangeType {
  CREATE,
  DELETE,
  UPDATE,
}

process.env.GCLOUD_PROJECT = process.env.GCP_PROJECT;

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

const createUserDocument = async (
    user: UserRecord
  ):Promise<void> => {
    // Read all docs under config.scoreCollectionPath
    console.log(`Start createUserDocument()`);

    const userCollectionRef = db.collection(config.userCollectionPath);
    const templateDocRef = db.doc(config.templateDocPath);

    await db.runTransaction((transaction) => {
      const newUserDocRef = userCollectionRef.doc(user.uid)

      templateDocRef.get().then((value) => {
        const updateData = value.data();
        updateData[config.userNameFieldName] = user.displayName;
        newUserDocRef.set(updateData);
      });

      return Promise.resolve();
    });
    console.log(`End createLeaderboardDocument()`);
};

const deleteUserDocument = async (
  user: UserRecord
):Promise<void> => {
  console.log(`Start deleteUserDocument()`);

  const userCollectionRef = db.collection(config.userCollectionPath);

  await db.runTransaction((transaction) => {
    userCollectionRef.doc(user.uid).delete();

    return Promise.resolve();
  });
  console.log(`End deleteUserDocument()`);
};

const updateTemplateDocument = async (
  change: functions.Change<admin.firestore.DocumentSnapshot>
):Promise<void> => {
  console.log(`Start updateTemplateDocument()`);
  const userCollectionRef = db.collection(config.userCollectionPath);
  const templateDocRef = db.doc(config.templateDocPath);

  await db.runTransaction((transaction) => {
    userCollectionRef.get().then(querySnapshot => {
      console.log(`querySnapshot size is ${querySnapshot.size}`);
      // Need to think about what kind of update in the template that we would like to apply to
      // existing user doc.
    });

    return Promise.resolve();
  });
  
  console.log(`End updateTemplateDocument()`);
};

export const onUserAdd = functions.auth.user().onCreate(
  async (user): Promise<void> => {
    console.log(`Start onUserAdd()`);
    createUserDocument(user);
    console.log(`End onUserAdd()`);
  }
);

export const onUserDelete = functions.auth.user().onDelete(
  async (user): Promise<void> => {
    console.log(`Start onUserDelete()`);
    deleteUserDocument(user);
    console.log(`End onUserDelete()`);
  }
);


export const onTemplateChange = functions.firestore.document(config.templateDocPath).onWrite(
  async (change): Promise<void> => {
    logs.start(config);

    const changeType = getChangeType(change);

    try {
      switch (changeType) {
        case ChangeType.CREATE:
        case ChangeType.DELETE:
          break;
        case ChangeType.UPDATE:
          logs.changeUpdate();
          updateTemplateDocument(change);
          break;
      }

      //logs.complete();
    } catch (err) {
      //logs.error(err);
    }
  }
);
