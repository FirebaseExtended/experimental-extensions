import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logs from "./logs";
import config from "./config";
import { noticeConverter, acknowledgementConverter, unacknowledgementConverter } from "./converter";

import { getEventarc } from "firebase-admin/eventarc";
import { Acknowledgement, Notice } from "./interface";
import { firestore } from "firebase-admin";

const eventChannel =
  process.env.EVENTARC_CHANNEL &&
  getEventarc().channel(process.env.EVENTARC_CHANNEL, {
    allowedEventTypes: process.env.EXT_SELECTED_EVENTS,
  });

admin.initializeApp();
const db = admin.firestore();

logs.init();

function assertAuthenticated(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated."
    );
  }
}

function assertAllowed(
  context: functions.https.CallableContext,
  notice: Notice,
  error: string
) {
  if (
    notice.allowList.length > 0 &&
    !notice.allowList.includes(context.auth!.uid)
  ) {
    throw new functions.https.HttpsError("not-found", error);
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

  let query = db
    .collection(config.noticesCollectionPath)
    .where("type", "==", data.type);

  if (data.version) {
    query = query.where("version", "==", data.version);
  }

  const snapshot = await query
    .orderBy("createdAt", "desc")
    .limit(1)
    .withConverter(noticeConverter)
    .get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError(
      "not-found",
      `No notices with the type ${data.type} could be found.`
    );
  }

  const noticeData = snapshot.docs[0].data();
  const { allowList, ...notice } = noticeData;

  assertAllowed(
    context,
    noticeData,
    `No notices with the type ${data.type} could be found.`
  );

  const acknowledgementsSnapshot = await db
    .collection(config.noticesCollectionPath)
    .doc(notice.id)
    .collection("acknowledgements")
    .where("userId", "==", context.auth!.uid)
    .withConverter(acknowledgementConverter)
    .get();

  // Create a variable to assert a typed response
  const response: Omit<Notice, "allowList"> & {
    acknowledgements: Acknowledgement[];
  } = {
    ...notice,
    acknowledgements: acknowledgementsSnapshot.docs.map((doc) => doc.data()),
  };

  return response;
});

async function handleAcknowledgement(
  data: any,
  context: functions.https.CallableContext
): Promise<firestore.DocumentSnapshot<Notice>> {
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

  assertAllowed(
    context,
    noticeSnapshot.data(),
    `No notice with the id ${data.noticeId} could be found.`
  );

  return noticeSnapshot;
}

export const acknowledgeNotice = functions.https.onCall(async (data, context) => {
  const snapshot = await handleAcknowledgement(data, context);

  const documentData = {
    userId: context.auth!.uid,
    noticeId: snapshot.id,
    type: data.type || "seen",
    metadata: data.metadata || {},
  };

  const result = await db
    .collection(config.noticesCollectionPath)
    .doc(data.noticeId)
    .collection("acknowledgements")
    .withConverter(acknowledgementConverter)
    // @ts-expect-error - cant paritally type set arguments in the converter
    .add(documentData);

  await eventChannel?.publish({
    type: `firebase.google.v1.acknowledgement`,
    data: JSON.stringify({
      ...documentData,
      id: result.id,
    }),
  });
});

export const unacknowledgeNotice = functions.https.onCall(async (data, context) => {
  const snapshot = await handleAcknowledgement(data, context);

  const documentData = {
    userId: context.auth!.uid,
    noticeId: snapshot.id,
    metadata: data.metadata || {},
  };

  const result = await db
    .collection(config.noticesCollectionPath)
    .doc(data.noticeId)
    .collection("acknowledgements")
    .withConverter(unacknowledgementConverter)
    // @ts-expect-error - cant paritally type set arguments in the converter
    .add(documentData);

  await eventChannel?.publish({
    type: `firebase.google.v1.unacknowledgement`,
    data: JSON.stringify({
      ...documentData,
      id: result.id,
    }),
  });
});

export const getAcknowledgements = functions.https.onCall(
  async (data, context) => {
    assertAuthenticated(context);

    const uid = context.auth!.uid;

  const snapshot = await db
    .collectionGroup("acknowledgements")
    .where('userId', "==", uid)
    // TODO this can't work with a differing acknowledgement structure
    // .withConverter(acknowledgementConverter)
    .get();

  // TODO casting
  const acknowledements = snapshot.docs.map((doc) => doc.data()) as Acknowledgement[];

  const noticeReferences = acknowledements.map((doc) =>
    db.collection("notices").doc(doc.noticeId).withConverter(noticeConverter)
  );

    const noticeSnapshots = (await db.getAll(
      ...noticeReferences
    )) as firestore.DocumentSnapshot<Notice>[];

  const response: (Acknowledgement & { notice: Omit<Notice, "allowList"> })[] =
    acknowledements.map((doc) => {
      const noticeData = noticeSnapshots
        .find((notice) => notice.id === doc.noticeId)!
        .data();
      const { allowList, ...notice } = noticeData;

      return {
        ...doc,
        notice,
      };
    });

    return response;
  }
);
