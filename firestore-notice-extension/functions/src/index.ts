import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as log from "./logs";
import config from "./config";
import { noticeConverter, acknowledgementConverter } from "./converter";

import { getEventarc } from "firebase-admin/eventarc";
import { AcknowledgementStatus } from "./interface";
import { firestore } from "firebase-admin";

const eventChannel =
  process.env.EVENTARC_CHANNEL &&
  getEventarc().channel(process.env.EVENTARC_CHANNEL, {
    allowedEventTypes: process.env.EXT_SELECTED_EVENTS,
  });

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

function assertAuthenticated(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated."
    );
  }
}

export const getNotice = functions.https.onCall(async (data, context) => {
  assertAuthenticated(context);

  if (!data.type) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No notice `type` has been provided."
    );
  }

  const snapshot = await db
    .collection(config.noticesCollectionPath)
    .where("type", "==", data.type)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .withConverter(noticeConverter)
    .get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError(
      "not-found",
      `No notices with the type ${data.type} could be found.`
    );
  }

  const notice = snapshot.docs[0].data();

  const acknowledgementSnapshot = await db
    .collection(config.noticesCollectionPath)
    .doc(notice.id)
    .collection("acknowledgements")
    .doc(context.auth!.uid)
    .withConverter(acknowledgementConverter)
    .get();

  return {
    ...notice,
    acknowledgement:  acknowledgementSnapshot.data(),
  };
});

async function handleAcknowledgement(
  data: any,
  context: functions.https.CallableContext,
  status: AcknowledgementStatus
): Promise<void> {
  assertAuthenticated(context);

  if (!data.noticeId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No `noticeId` has been provided."
    );
  }

  const noticeSnapshot = await db
    .collection(config.noticesCollectionPath)
    .doc(data.noticeId)
    .withConverter(noticeConverter)
    .get();

  if (!noticeSnapshot.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      `No notice with the id ${data.noticeId} could be found.`
    );
  }

  await db
    .collection(config.noticesCollectionPath)
    .doc(data.noticeId)
    .collection("acknowledgements")
    .doc(context.auth!.uid)
    .withConverter(acknowledgementConverter)
    // @ts-expect-error - cant paritally type set arguments in the converter
    .set({
      noticeId: data.noticeId,
      status,
      metadata: data.metadata || {},
    });

  await eventChannel?.publish({
    type: `firebase.google.v1.acknowledgement-${status}`,
    data: JSON.stringify({
      noticeId: data.noticeId,
      userId: context.auth!.uid,
      status,
      metadata: data.metadata || {},
    }),
  });
}

export const acceptNotice = functions.https.onCall(async (data, context) => {
  await handleAcknowledgement(data, context, AcknowledgementStatus.ACCEPTED);
});

export const declineNotice = functions.https.onCall(async (data, context) => {
  await handleAcknowledgement(data, context, AcknowledgementStatus.DECLINED);
});

export const seenNotice = functions.https.onCall(async (data, context) => {
  await handleAcknowledgement(data, context, AcknowledgementStatus.SEEN);
});

export const getAcknowledgements = functions.https.onCall(async (data, context) => {
  assertAuthenticated(context);

  const uid = context.auth!.uid;

  const snapshot = await db
    .collectionGroup("acknowledgements")
    .where(firestore.FieldPath.documentId(), "==", uid)
    .withConverter(acknowledgementConverter)
    .get();

  const docs = snapshot.docs.map((doc) => doc.data());
  const noticeReferences = docs.map((doc) => db.collection("notices").doc(doc.noticeId));
  const noticeSnapshots = await db.getAll(...noticeReferences);

  return docs.map((doc, index) => ({
    ...doc,
    notice: noticeSnapshots[index].data(),
  }));
});
