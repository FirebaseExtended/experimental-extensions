import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as log from "./logs";
import config from "./config";
import { user } from "firebase-functions/v1/auth";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

const auth = admin.auth();
const db = admin.firestore();

export const acceptTerms = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      return;
    }

    /** check if tosId has been provided  */
    if (!data.tosId) {
      console.warn("No tosId provided");
      return;
    }

    /** check tos documents */
    const tosDoc = await db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos")
      .doc(data.tosId)
      .get();

    /** Return if no agreement exists  */
    if (!tosDoc || !tosDoc.exists) {
      console.warn("tosDoc does not exist");
      return;
    }

    /** Find current acknowledgements */
    const acknowledgements = await db
      .collection(config.collectionPath)
      .doc("acknowledgements")
      .collection(context.auth.uid)
      .doc(`${process.env.EXT_INSTANCE_ID}`)
      .get()
      .then(($) => $.data() || {});

    acknowledgements[data.tosId] = {
      ...tosDoc.data(),
      acceptanceDate: admin.firestore.FieldValue.serverTimestamp(),
    };

    /** Add Acceptance cliam to user document list */
    await db
      .collection(config.collectionPath)
      .doc("acknowledgements")
      .collection(context.auth.uid)
      .doc(`${process.env.EXT_INSTANCE_ID}`)
      .set({ ...(acknowledgements || {}) });

    /** Set claims on user and return */
    const claims = {};
    claims[process.env.EXT_INSTANCE_ID] = acknowledgements;
    return auth.setCustomUserClaims(context.auth.uid, { ...claims });
  }
);

export const createTerms = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      return;
    }

    /** check if tos data has been provided  */
    if (!data) {
      return;
    }

    /** check if tos data has been provided  */
    if (!data.noticeType) {
      return { error: "No noticeType provided" };
    }

    /** Set claims on user and return */
    return db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos")
      .doc(data.tosId)
      .set({
        ...data,
        creationDate: admin.firestore.FieldValue.serverTimestamp(),
      });
  }
);

export const getTerms = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      return;
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

      return query.get().then((doc) => doc.docs.map(($) => $.data()));
    }

    if (latest_only) query.orderBy("creationDate", "desc").limit(1);
    if (tosId) query.where("tosId", "==", tosId);

    return query.get().then((doc) => doc.docs[0].data());
  }
);

export const getAcknowledgements = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      return;
    }

    return db
      .collection(config.collectionPath)
      .doc("acknowledgements")
      .collection(context.auth.uid)
      .doc(`${process.env.EXT_INSTANCE_ID}`)
      .get()
      .then((doc) => doc.data());
  }
);
