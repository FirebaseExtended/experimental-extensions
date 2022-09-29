import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logs from "./logs";
import config from "./config";
import { noticeConverter, acknowledgementConverter } from "./converter";

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

// Throws an error if the user is not authenticated.
function assertAuthenticated(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated."
    );
  }
}

// Throws an error if the user is not allowed to see the notice.
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

type GetNoticeResponse = Omit<Notice, "allowList"> & {
  unacknowledgedAt?: firestore.Timestamp;
  acknowledgements: Acknowledgement[];
};

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
    .orderBy("createdAt", "desc")
    .withConverter(acknowledgementConverter)
    .get();

  // Get an array of plain acknowledgement objects.
  const acknowledgements = acknowledgementsSnapshot.docs.map((doc) =>
    doc.data()
  );

  // Check if the user has acknowledged the notice.
  const unacknowledgedAt =
    acknowledgements.length === 0
      ? undefined
      : acknowledgements[0].acknowledgement === "unacknowledged"
      ? acknowledgements[0].createdAt
      : undefined;

  // Create a variable to assert a typed response
  const response: GetNoticeResponse = {
    ...notice,
    unacknowledgedAt,
    acknowledgements,
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

export const acknowledgeNotice = functions.https.onCall(
  async (data, context) => {
    const snapshot = await handleAcknowledgement(data, context);

    const documentData = {
      event: "acknowledgement",
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

    logs.acknowledgeNotice(documentData);
  }
);

export const unacknowledgeNotice = functions.https.onCall(
  async (data, context) => {
    const snapshot = await handleAcknowledgement(data, context);

    const documentData = {
      event: "unacknowledgement",
      userId: context.auth!.uid,
      noticeId: snapshot.id,
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
      type: `firebase.google.v1.unacknowledgement`,
      data: JSON.stringify({
        ...documentData,
        id: result.id,
      }),
    });

    logs.unacknowledgeNotice(documentData);
  }
);

type GetAcknowledgementsResponse = (Acknowledgement & {
  notice: Omit<Notice, "allowList">;
})[];

export const getAcknowledgements = functions.https.onCall(
  async (data, context) => {
    assertAuthenticated(context);

    const uid = context.auth!.uid;

    let query = db
      .collectionGroup("acknowledgements")
      .where("userId", "==", uid);

    // If `includeUnacknowledgements` is true, we want to include all acknowledgements.
    // By default, this will include everything.
    if (data.includeUnacknowledgements !== true) {
      query = query.where("acknowledgement", "==", "acknowledged");
    }

    // Get a list of all the acknowledgements for a single user.
    const snapshot = await query
      .orderBy("createdAt", "desc")
      .withConverter(acknowledgementConverter)
      .get();

    // Return early if no acknowledgements exist.
    if (snapshot.empty) {
      return [];
    }

    const acknowledements = snapshot.docs.map((doc) => doc.data());

    const noticeReferences = acknowledements.map((doc) =>
      db.collection("notices").doc(doc.noticeId).withConverter(noticeConverter)
    );

    const noticeSnapshots = (await db.getAll(
      ...noticeReferences
    )) as firestore.DocumentSnapshot<Notice>[];

    const cache = new Map<string, Notice>();

    const response: GetAcknowledgementsResponse = acknowledements.map((doc) => {
      const noticeData =
        cache.get(doc.noticeId) ||
        noticeSnapshots.find((notice) => notice.id === doc.noticeId)!.data();

      if (!cache.has(doc.noticeId)) {
        cache.set(doc.noticeId, noticeData);
      }

      const { allowList, ...notice } = noticeData;

      return {
        ...doc,
        notice,
      };
    });

    return response;
  }
);
