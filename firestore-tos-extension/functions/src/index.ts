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

    /** Find current acceptances */
    const tos_acceptances = await db
      .collection(config.collectionPath)
      .doc("acceptances")
      .collection(context.auth.uid)
      .doc(`${process.env.EXT_INSTANCE_ID}`)
      .get()
      .then(($) => $.data() || {});

    tos_acceptances[data.tosId] = tosDoc.data();

    /** Add Acceptance cliam to user document list */
    await db
      .collection(config.collectionPath)
      .doc("acceptances")
      .collection(context.auth.uid)
      .doc(`${process.env.EXT_INSTANCE_ID}`)
      .set({ ...(tos_acceptances || {}) });

    /** Set claims on user and return */
    const claims = {};
    claims[process.env.EXT_INSTANCE_ID] = tos_acceptances;
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

    /** Set claims on user and return */
    return db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos")
      .doc(data.tosId)
      .set({
        ...data,
        creationDate: new Date().toLocaleDateString(),
        acceptanceDate: new Date().toLocaleDateString(),
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
      const [key, value] = Object.entries(custom_filter)[0];
      const queryObject = { [key]: value };
      query.where(`noticeType`, "array-contains", { queryObject }).limit(1);
    }

    if (latest_only) query.orderBy("creationDate", "desc").limit(1);
    if (tosId) query.where("tosId", "==", tosId);

    return query.get().then((doc) => doc.docs[0].data());
  }
);

export const getAcceptances = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      return;
    }

    return db
      .collection(config.collectionPath)
      .doc("acceptances")
      .collection(context.auth.uid)
      .doc(`${process.env.EXT_INSTANCE_ID}`)
      .get()
      .then((doc) => doc.data());
  }
);
