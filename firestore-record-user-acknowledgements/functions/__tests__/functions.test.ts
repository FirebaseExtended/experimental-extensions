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
 * This is because admin.initializeApp() is called in the index file
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
  config.default.noticesCollection
);

const createNotice = async ({
  name = "banner",
  metadata = {},
  type = "banner",
  allowList = null,
}) => {
  return admin
    .firestore()
    .collection("notices")
    .add({ name, metadata, createdAt: new Date(), type, allowList });
};

describe("functions testing", () => {
  let user;

  beforeEach(async () => {
    /** create example user */
    user = await auth.createUser({});
  });

  describe("acknowledgements", () => {
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
        .collection(config.default.acknowledgementsCollection);

      /** Set query */
      const query = AckCollection.where("userId", "==", user.uid);

      /** Wait for update */
      const snapshot = await query.limit(1).get();

      /** Get the acknowledgement document */
      const acknowledgement = snapshot.docs[0].data();

      /** Assert data */
      expect(acknowledgement.type).toBe("seen");
      expect(acknowledgement.noticeId).toBe(noticeId);
      expect(acknowledgement.userId).toBe(user.uid);
      expect(acknowledgement.metadata.test).toEqual("value");
    });

    test("will throw an error with no authentication provided", () => {
      expect(acknowledgeNoticeFn.call({}, {}, {})).rejects.toThrowError(
        "User must be authenticated."
      );
    });
  });

  describe("get notice", () => {
    let noticeId;
    let type;

    beforeEach(async () => {
      type = "banner";
      const notice = await createNotice({ type, allowList: [user.uid] });

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
      expect(
        getNoticeFn.call({}, {}, { auth: { uid: user.uid } })
      ).rejects.toThrow("No notice `type` has been provided.");
    });

    test("will throw an error with a notice cannot be found", () => {
      expect(
        getNoticeFn.call({}, { type: "unknown" }, { auth: { uid: user.uid } })
      ).rejects.toThrowError(
        "No notices with the type unknown could be found."
      );
    });

    test("will throw an error with no authentication provided", () => {
      expect(getNoticeFn.call({}, {}, {})).rejects.toThrowError(
        "User must be authenticated."
      );
    });

    test("will throw an error if user is not in the allow list", () => {
      expect(
        getNoticeFn.call({}, { type }, { auth: { uid: "unknown" } })
      ).rejects.toThrowError("No notices with the type banner could be found.");
    });
  });
});
