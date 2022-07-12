import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as log from "./logs";
import config from "./config";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

const auth = admin.auth();

export const acceptTerms = functions.handler.https.onCall((data, context) => {
  // Checking that the user is authenticated.
  if (!context.auth) {
    return;
  }

  console.log("test 2 >>>>", process.env);

  const claims = {};
  claims[`${process.env.EXT_INSTANCE_ID}`] = {
    tos_acceptances: [
      {
        tos_id: "publisher_tos_v1",
        creation_date: "2021/02/23",
        acceptance_date: "2022/02/23",
        custom_attributes: {
          role: "consumer",
        },
      },
      {
        tos_id: "publisher_tos_v2",
        creation_date: "2021/02/24",
        acceptance_date: "2022/02/23",
      },
    ],
  };

  return admin.auth().setCustomUserClaims(context.auth.uid, claims);
});
