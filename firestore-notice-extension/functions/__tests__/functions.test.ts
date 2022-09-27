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

describe("functions testing", () => {
  describe("accept notice", () => {
    let user;
    let noticeId;

    beforeEach(async () => {
      // create a notice
      const randomId = Math.random().toString(36).substring(2, 15);
      noticeId = `notice_v${randomId}`;

      await admin.firestore().collection("notices").doc(noticeId).set({});

      /** create example user */
      user = await auth.createUser({});
    });

    test("can accept a notice", async () => {
      /** Accept notice */
      await acceptNoticeFn.call({}, { noticeId }, { auth: { uid: user.uid } });

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
    });
  });
});
