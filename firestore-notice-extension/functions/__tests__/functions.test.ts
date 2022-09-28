import * as admin from "firebase-admin";
import { firestore } from "firebase-admin";

import setupEnvironment from "./helpers/setupEnvironment";
import * as config from "../src/config";

import { Acknowledgement, AcknowledgementStatus } from "../src/interface";
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
import { waitForDocumentUpdate } from "./helpers";
/** prepare extension functions */
const acceptNoticeFn = fft.wrap(funcs.acceptNotice);
const acknowledgeNoticeFn = fft.wrap(funcs.seenNotice);
const unacknowledgeNoticeFn = fft.wrap(funcs.declineNotice);
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

  describe("accept notice", () => {
    let noticeId;

    beforeEach(async () => {
      const notice = await admin
        .firestore()
        .collection("notices")
        .add({ name: "banner", metadata: { test: "value" } });

      noticeId = notice.id;
    });

    test("can accept a notice", async () => {
      /** Accept notice */
      await acceptNoticeFn.call(
        {},
        { noticeId, metadata: { test: "value" } },
        { auth: { uid: user.uid } }
      );

      /** Get notice */
      const doc = noticesCollection
        .doc(noticeId)
        .collection("acknowledgements")
        .doc(user.uid);

      /** Wait for update */
      const acknoweldgement = await waitForDocumentUpdate(
        doc,
        "status",
        `accepted`
      );

      /** Assert data */
      const response = acknoweldgement.data();

      expect(response.status).toBe("accepted");
      expect(response.noticeId).toBe(noticeId);
      expect(response.userId).toBe(user.uid);
      expect(response.metadata.test).toEqual("value");
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
