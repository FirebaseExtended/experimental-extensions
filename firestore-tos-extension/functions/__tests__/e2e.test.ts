import * as admin from "firebase-admin";
import setupEnvironment from "../__tests__/helpers/setupEnvironment";

import { TermsOfServiceAcceptance } from "../src/interface";
const fft = require("firebase-functions-test")();

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

setupEnvironment();

import * as funcs from "../src/index";

const db = admin.firestore();
const auth = admin.auth();

describe("e2e testing", () => {
  describe("trello", () => {
    let user;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});
    });

    test("Can add custom claims", async () => {
      const wrapped = fft.wrap(funcs.acceptTerms);

      await wrapped.call({}, {}, { auth: { uid: user.uid } });

      const userRecord = await auth.getUser(user.uid);

      expect(userRecord).toBeDefined();
      expect(userRecord?.customClaims).toBeDefined();

      //TODO: Format assertion

      // const terms = userRecord?.customClaims?[process.env.EXT_INSTANCE_ID]

      // expect(terms).toBeDefined();

      // expect(terms?.tos_acceptances).toBeDefined();

      // const acceptances: TermsOfServiceAcceptance = terms.tos_acceptances?[0]: null;

      // expect(acceptances).toBeDefined();
      // expect(acceptances.tosId).toBeDefined();
      // expect(acceptances.creationDate).toBeDefined();
      // expect(acceptances.acceptanceDate).toBeDefined();
      // expect(acceptances.customAttributes).toBeDefined();
      // expect(acceptances.customAttributes?.role).toBeDefined();
    });
  });
});
