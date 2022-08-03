import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as log from "./logs";
import config from "./config";
import { termsConverter, acknowledgementConverter } from "./converter";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

const auth = admin.auth();
const db = admin.firestore();

export const acceptTerms = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "No valid authentication token provided."
      );
    }

    /** check if tosId has been provided  */
    if (!data.tosId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No tosId provided."
      );
    }

    /** check tos documents */
    const tosDoc = await db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos")
      .doc(data.tosId)
      .withConverter(termsConverter)
      .get();

    /** Return if no agreement exists  */
    if (!tosDoc || !tosDoc.exists) {
      console.warn("tosDoc does not exist");
      return;
    }

    /** Set new acknowledgment */
    const ack = {
      ...tosDoc.data(),
      acceptanceDate: admin.firestore.FieldValue.serverTimestamp(),
    };

    /** Add Acknowledgment */
    await db
      .collection(config.collectionPath)
      .doc("acknowledgements")
      .collection(context.auth.uid)
      .doc(data.tosId)
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

    return auth.setCustomUserClaims(context.auth.uid, {
      ...existingClaims,
      ...claims,
    });
  }
);

export const createTerms = functions.handler.https.onCall(
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
      .doc(data.tosId)
      .withConverter(termsConverter)
      .set(
        {
          ...data,
          creationDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }
);

export const getTerms = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "No valid authentication token provided."
      );
    }

    const { tosId, latest_only = false, custom_filter } = data;

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
        .withConverter(termsConverter)
        .get()
        .then((doc) => doc.docs.map(($) => $.data()));
    }

    if (latest_only) query.orderBy("creationDate", "desc").limit(1);

    if (tosId)
      return query
        .where("tosId", "==", tosId)
        .limit(1)
        .withConverter(termsConverter)
        .get()
        .then((doc) => doc.docs[0].data());

    return query
      .withConverter(termsConverter)
      .get()
      .then((doc) => doc.docs[0].data());
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
      .doc(data.tosId)
      .withConverter(acknowledgementConverter)
      .get()
      .then((doc) => doc.data());
  }
);
