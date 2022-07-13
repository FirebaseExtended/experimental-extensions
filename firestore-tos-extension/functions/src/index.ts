import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as log from "./logs";
import config from "./config";

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

    /** check if tos_id has been provided  */
    if (!data.tos_id) {
      console.warn("No tos_id provided");
      return;
    }

    /** check tos documents */
    const tosDoc = await db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos")
      .doc(data.tos_id)
      .get();

    /** Return if no agreement exists  */
    if (!tosDoc || !tosDoc.exists) {
      console.warn("tosDoc does not exist");
      return;
    }

    const tos_acceptances = await auth
      .getUser(context.auth.uid)
      .then(async (user) => {
        if (!user.customClaims) return [];
        return (
          user.customClaims[`${process.env.EXT_INSTANCE_ID}`]
            ?.tos_acceptances || []
        );
      });

    const claims = {};
    claims[`${process.env.EXT_INSTANCE_ID}`] = {
      tos_acceptances: [
        ...tos_acceptances,
        {
          tosId: "publisher_tos_v1",
          creationDate: new Date().toLocaleDateString(),
          acceptanceDate: new Date().toLocaleDateString(),
          customAttributes: {
            role: "consumer",
          },
        },
      ],
    };

    /** Add Acceptance cliam to user document list */
    await db
      .collection(config.collectionPath)
      .doc("acceptances")
      .collection(context.auth.uid)
      .add({ claims });

    /** Set claims on user and return */
    return auth.setCustomUserClaims(context.auth.uid, claims);
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
      .doc(data.tos_id)
      .set(data);
  }
);

export const getTerms = functions.handler.https.onCall(
  async (data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
      return;
    }

    const { tos_id, latest_only = false } = data;

    const query = db
      .collection(config.collectionPath)
      .doc("agreements")
      .collection("tos");

    if (latest_only) query.orderBy("creationDate", "desc").limit(1);
    if (tos_id) query.where("tos_id", "==", tos_id);

    return query.get().then((doc) => doc.docs[0].data());
  }
);
