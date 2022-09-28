import * as admin from "firebase-admin";
import { firestore } from "firebase-admin";

import setupEnvironment from "./helpers/setupEnvironment";
import * as config from "../src/config";

const fft = require("firebase-functions-test")();

/** Initialize app for the emulator */
admin.initializeApp({ projectId: "demo-experimental" });
setupEnvironment();

/**
 * Test functions will try to initialize app
 * This is becaseu aadmin.initializeApp() is called in the index file
 * Use this mock to stop the app from being initialized in the test fn
 */

jest.spyOn(admin, "initializeApp").mockImplementation();

import * as funcs from "../src/index";
import { waitForDocumentToExistInCollection } from "./helpers";
/** prepare extension functions */
const acknowledgeNoticeFn = fft.wrap(funcs.acknowledgeNotice);
const getNoticeFn = fft.wrap(funcs.getNotice);
const getAcknowledgements = fft.wrap(funcs.getAcknowledgements);

const auth = admin.auth();

/**prepare collections */
const noticesCollection = firestore().collection(
  config.default.noticesCollectionPath
);

const createNotice = async ({
  name = "banner",
  metadata = {},
  type = "banner",
}) => {
  return admin
    .firestore()
    .collection("notices")
    .add({ name, metadata, createdAt: new Date(), type });
};

describe("functions testing", () => {
  let user;

  beforeEach(async () => {
    /** create example user */
    user = await auth.createUser({});
  });

  describe("acknowledge notice", () => {
    let noticeId;

    beforeEach(async () => {
      const notice = await admin
        .firestore()
        .collection("notices")
        .add({ name: "banner", metadata: { test: "value" } });

      noticeId = notice.id;
    });

    test("can acknowledge a notice", async () => {
      /** Accept notice */
      await acknowledgeNoticeFn.call(
        {},
        { noticeId, metadata: { test: "value" } },
        { auth: { uid: user.uid } }
      );

      /** Get notice */
      const AckCollection = noticesCollection
        .doc(noticeId)
        .collection("acknowledgements");

      /** Set query */
      const query = AckCollection.where("userId", "==", user.uid);

      /** Wait for update */
      const snapshot = await query.limit(1).get();

      /** Get the Acknolwedgement document */
      const acknoweldgement = snapshot.docs[0].data();

      /** Assert data */
      expect(acknoweldgement.type).toBe("seen");
      expect(acknoweldgement.noticeId).toBe(noticeId);
      expect(acknoweldgement.userId).toBe(user.uid);
      expect(acknoweldgement.metadata.test).toEqual("value");
    });
  });

  describe("get notice", () => {
    let noticeId;
    let type;

    beforeEach(async () => {
      type = "banner";
      const notice = await createNotice({ type });

      noticeId = notice.id;
    });

    test("can get a notice", async () => {
      /** Find notice */
      const resp = await getNoticeFn.call(
        {},
        { type },
        { auth: { uid: user.uid } }
      );

      expect(resp.id).toEqual(noticeId);
      expect(resp.type).toEqual(type);
      expect(resp.createdAt).toBeDefined();
    });

    test("will throw an error when a notice type has not been provided", async () => {
      /** Find notice */
      const resp = await getNoticeFn.call(
        {},
        { type },
        { auth: { uid: user.uid } }
      );
    });
  });
});
