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
  admin.initializeApp();
}

const auth = admin.auth();
const db = admin.firestore();

export const acceptNotice = functions.handler.https.onCall(
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

    /** check tos documents */
    const tosDoc = await db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos")
      .doc(data.noticeId)
      .withConverter(noticeConverter)
      .get();

    /** Return if no agreement exists  */
    if (!tosDoc || !tosDoc.exists) {
      console.warn("tosDoc does not exist");
      return;
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
      ...tosDoc.data(),
      ...data,
      ...acknowledgementDates,
    };

    /** Add Acknowledgment */
    await db
      .collection(config.collectionPath)
      .doc("acknowledgements")
      .collection(context.auth.uid)
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
      .collection(config.collectionPath)
      .doc("acknowledgements")
      .collection(context.auth.uid)
      .withConverter(acknowledgementConverter)
      .get()
      .then(($) => $.docs.map((doc) => doc.data()));

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

    /** check if tos data has been provided  */
    if (!data) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No valid data provided."
      );
    }

    /** check if tos data has been provided  */
    if (!data.noticeType) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid notice type"
      );
    }

    /** Set claims on user and return */
    return db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos")
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

    const { noticeId, latest_only = false, custom_filter } = data;

    const query = db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos");

    if (custom_filter) {
      Object.entries(custom_filter).forEach(([key, value]) => {
        const queryObject = { [key]: value };
        query.where(`noticeType`, "array-contains", { queryObject });
      });

      return query
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
      .collection(config.collectionPath)
      .doc("acknowledgements")
      .collection(context.auth.uid)
      .withConverter(acknowledgementConverter)
      .get()
      .then((doc) => doc.docs.map(($) => $.data()));
  }
);
