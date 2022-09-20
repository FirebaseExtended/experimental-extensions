import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as log from "./logs";
import config from "./config";
import { noticeConverter, acknowledgementConverter } from "./converter";

import { getEventarc } from "firebase-admin/eventarc";
import { AcknowledgementStatus } from "./interface";

const eventChannel =
  process.env.EVENTARC_CHANNEL &&
  getEventarc().channel(process.env.EVENTARC_CHANNEL, {
    allowedEventTypes: process.env.EXT_SELECTED_EVENTS,
  });

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

const auth = admin.auth();
const db = admin.firestore();

export const acknowledgeNotice = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "No valid authentication token provided."
      );
    }

    /** check if noticeId has been provided  */
    if (!data.noticeId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No noticeId provided."
      );
    }

    if (data.acknowledged === null) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No acknowledgement value provided."
      );
    }

    /** check notice documents */
    const noticeDoc = await db
      .collection(config.noticeCollectionPath)
      .doc(data.noticeId)
      .withConverter(noticeConverter)
      .get();

    /** Return if no acknowledgement exists  */
    if (!noticeDoc || !noticeDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Notice document does not exist."
      );
    }

    const acknowledgementDates = {};

    if (data.status === AcknowledgementStatus.ACCEPTED) {
      //@ts-ignore
      acknowledgementDates.acknowledgedDate =
        admin.firestore.FieldValue.serverTimestamp();
    }

    if (data.status === AcknowledgementStatus.DECLINED) {
      //@ts-ignore
      acknowledgementDates.unacknowledgedDate =
        admin.firestore.FieldValue.serverTimestamp();
    }

    /** Set new acknowledgment */
    const ack = {
      ...noticeDoc.data(),
      ...data,
      ...acknowledgementDates,
    };

    /** Add Acknowledgment */
    await db
      .collection(config.acknowlegementsCollectionPath)
      .doc(context.auth.uid)
      .collection(config.noticeCollectionPath)
      .doc(data.noticeId)
      .withConverter(acknowledgementConverter)
      .set(
        { ...ack },
        {
          merge: true,
        }
      );

    /** Find current acknowledgements */
    const acknowledgements = await db
      .collection(config.acknowlegementsCollectionPath)
      .doc(context.auth.uid)
      .collection(config.noticeCollectionPath)
      .withConverter(acknowledgementConverter)
      .get()
      .then(($) => $.docs.map((doc) => doc.id));

    /** Set claims on user and return */
    const claims = {};
    claims[process.env.EXT_INSTANCE_ID] = acknowledgements;

    const { customClaims: existingClaims } = await auth.getUser(
      context.auth.uid
    );

    const updatedClaims = await auth.setCustomUserClaims(context.auth.uid, {
      ...existingClaims,
      ...claims,
    });

    /** send event if configured */
    await eventChannel?.publish({
      type: "firebase.google.v1.acknowledgement-accepted",
      data: JSON.stringify(updatedClaims),
    });
  }
);

export const createNotice = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "No valid authentication token provided."
      );
    }

    /** check if notice data has been provided  */
    if (!data) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No valid data provided."
      );
    }

    /** Set claims on user and return */
    return db
      .collection(config.noticeCollectionPath)
      .doc(data.noticeId)
      .withConverter(noticeConverter)
      .set(
        {
          ...data,
          creationDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }
);

export const getNotices = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "No valid authentication token provided."
      );
    }

    const { noticeId, latest_only = false, noticeType } = data;

    const query = db.collection(config.noticeCollectionPath);

    if (noticeType) {
      return query
        .where(`noticeType`, "==", noticeType)
        .withConverter(noticeConverter)
        .get()
        .then((doc) => doc.docs.map(($) => $.data()));
    }

    if (latest_only) {
      return query
        .orderBy("creationDate", "desc")
        .limit(1)
        .withConverter(noticeConverter)
        .get()
        .then((doc) => doc.docs[0].data());
    }

    if (noticeId)
      return query
        .where("noticeId", "==", noticeId)
        .limit(1)
        .withConverter(noticeConverter)
        .get()
        .then((doc) => doc.docs[0].data());

    return query
      .withConverter(noticeConverter)
      .get()
      .then(({ docs }) => {
        if (docs.length) return docs.map(($) => $.data());
        return [];
      });
  }
);

export const getAcknowledgements = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "No valid authentication token provided."
      );
    }

    return db
      .collection(config.acknowlegementsCollectionPath)
      .doc(context.auth.uid)
      .collection(config.noticeCollectionPath)
      .withConverter(acknowledgementConverter)
      .get()
      .then((doc) => doc.docs.map(($) => $.data()));
  }
);

export const unacknowledgeNotice = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "No valid authentication token provided."
      );
    }

    /** check notice documents */
    const noticeDoc = await db
      .collection(config.noticeCollectionPath)
      .doc(data.noticeId)
      .withConverter(noticeConverter)
      .get();

    /** Return if no acknowledgement exists  */
    if (!noticeDoc || !noticeDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Notice document does not exist."
      );
    }

    /** Set new acknowledgment */
    const ack = {
      ...noticeDoc.data(),
      ...data,
      unacknowledgedDate: admin.firestore.FieldValue.serverTimestamp(),
    };

    /** Add Acknowledgment */
    await db
      .collection(config.acknowlegementsCollectionPath)
      .doc(context.auth.uid)
      .collection(config.noticeCollectionPath)
      .doc(data.noticeId)
      .withConverter(acknowledgementConverter)
      .set(
        {
          status: AcknowledgementStatus.DECLINED,
          unacknowledgedDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        }
      );

    /** Removed unacknowledged claims */
    const { customClaims } = await auth.getUser(context.auth.uid);

    if (customClaims) {
      const extClaims =
        customClaims[process.env.EXT_INSTANCE_ID]?.filter(
          (claim) => claim !== data.noticeId
        ) || [];

      customClaims[process.env.EXT_INSTANCE_ID] = extClaims;

      await auth.setCustomUserClaims(context.auth.uid, customClaims);
    }
  }
);
