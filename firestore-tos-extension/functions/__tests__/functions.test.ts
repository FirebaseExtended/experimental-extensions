import setupEnvironment from "./helpers/setupEnvironment";
setupEnvironment();

import * as admin from "firebase-admin";
const fft = require("firebase-functions-test")();

import { TermsOfServiceAcceptance } from "../src/interface";
import * as funcs from "../src/index";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

const auth = admin.auth();

/** prepare extension functions */
const acceptTermsFn = fft.wrap(funcs.acceptTerms);
const createTermsFn = fft.wrap(funcs.createTerms);
const getTermsFn = fft.wrap(funcs.getTerms);
const getAcceptances = fft.wrap(funcs.getAcceptances);

describe("functions testing", () => {
  describe("accept terms", () => {
    describe("with a valid terms of service available", () => {
      let user;
      let tosId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        tosId = `tos_v${randomId}`;

        await createTermsFn.call(
          {},
          {
            link: "www.link.to.terms",
            tosId,
            creationDate: new Date().toLocaleDateString(),
          },
          { auth: { uid: user.uid } }
        );
      });

      test("can accept a terms of service", async () => {
        await acceptTermsFn.call(
          {},
          {
            tosId,
          },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        expect(userRecord).toBeDefined();
        expect(userRecord?.customClaims).toBeDefined();

        const terms = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];
        expect(terms).toBeDefined();
        expect(terms[tosId]).toBeDefined();

        const acceptances: TermsOfServiceAcceptance = terms[tosId];

        expect(acceptances).toBeDefined();
        expect(acceptances.tosId).toBeDefined();
        expect(acceptances.creationDate).toBeDefined();
        expect(acceptances.acceptanceDate).toBeDefined();
      });

      test("can accept multiple terms of service agreements", async () => {
        const tosId_2 = tosId + "_2";

        /** create a second agreement */
        await createTermsFn.call(
          {},
          {
            link: "www.link.to.terms",
            tosId: tosId_2,
          },
          { auth: { uid: user.uid } }
        );

        await acceptTermsFn.call({}, { tosId }, { auth: { uid: user.uid } });
        await acceptTermsFn.call(
          {},
          { tosId: tosId_2 },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        const terms = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];
        const acceptances: TermsOfServiceAcceptance = terms;

        expect(Object.keys(acceptances)).toHaveLength(2);
      });
    });

    describe("without a valid user", () => {
      let user;
      let tosId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        tosId = `tos_v${randomId}`;
      });

      test("does not add a terms of service", async () => {
        await acceptTermsFn.call({}, { tosId }, {});

        const userRecord = await auth.getUser(user.uid);

        const claims = userRecord?.customClaims;

        expect(claims).toBeUndefined();
      });
    });

    describe("Without a valid terms of service agreement", () => {
      let user;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});
      });

      test("does not add a terms of service without a provided tosId", async () => {
        await acceptTermsFn.call({}, {}, { auth: { uid: user.uid } });

        const userRecord = await auth.getUser(user.uid);

        const claims = userRecord?.customClaims;

        expect(claims).toBeUndefined();
      });

      test("does not add a terms of service without a exisiting tosId", async () => {
        await acceptTermsFn.call(
          {},
          { tosId: "unknown" },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        const claims = userRecord?.customClaims;

        expect(claims).toBeUndefined();
      });
    });
  });

  describe("get terms", () => {
    let user;
    let tosId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      tosId = `tos_v${randomId}`;
    });

    test("can get a terms of service", async () => {
      await createTermsFn.call(
        {},
        {
          link: "www.link.to.terms",
          tosId,
          creationDate: new Date().toLocaleDateString(),
        },
        { auth: { uid: "test" } }
      );

      const terms = await getTermsFn.call(
        {},
        { tosId },
        { auth: { uid: user.uid } }
      );

      expect(terms).toBeDefined();
      expect(terms?.link).toBeDefined();
      expect(terms?.tosId).toBeDefined();
      expect(terms?.creationDate).toBeDefined();
    });

    test("can get a terms of service by tosId", async () => {
      await createTermsFn.call(
        {},
        {
          link: "www.link.to.terms",
          tosId,
        },
        { auth: { uid: user.uid } }
      );

      const terms = await getTermsFn.call(
        {},
        { tosId },
        { auth: { uid: user.uid } }
      );

      expect(terms).toBeDefined();
      expect(terms?.link).toBeDefined();
      expect(terms?.tosId).toBeDefined();
      expect(terms?.creationDate).toBeDefined();
    });

    test("can get a terms with a custom filter", async () => {
      await createTermsFn.call(
        {},
        {
          link: "www.test.com",
          tosId,
          customAttributes: [{ role: "publisher" }],
        },
        { auth: { uid: user.uid } }
      );

      const terms = await getTermsFn.call(
        {},
        { custom_filter: { role: "publisher" } },
        { auth: { uid: user.uid } }
      );

      expect(terms).toBeDefined();
      expect(terms?.link).toBeDefined();
      expect(terms?.tosId).toBeDefined();
      expect(terms?.creationDate).toBeDefined();
      expect(terms?.customAttributes[0].role).toEqual("publisher");
    });
  });

  describe("create terms", () => {
    let user;
    let tosId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      tosId = `tos_v${randomId}`;
    });

    test("can create a terms of service", async () => {
      const link = "www.link.to.terms";
      const creationDate = new Date().toLocaleDateString();

      await createTermsFn.call(
        {},
        { tosId, link, creationDate },
        { auth: { uid: "test" } }
      );

      const terms = await admin
        .firestore()
        .collection("terms")
        .doc("agreements")
        .collection("tos")
        .doc(tosId)
        .get()
        .then((doc) => doc.data());

      expect(terms.tosId).toEqual(tosId);
      expect(terms.creationDate).toEqual(creationDate);
      expect(terms.link).toEqual(link);
    });

    test("can create a terms of service with a custom attribute", async () => {
      const link = "www.link.to.terms";
      const creationDate = new Date().toLocaleDateString();
      const customAttributes = [
        {
          role: "publisher",
          add_to_custom_claims: true,
        },
      ];

      await createTermsFn.call(
        {},
        { tosId, link, creationDate, customAttributes },
        { auth: { uid: "test" } }
      );

      const terms = await admin
        .firestore()
        .collection("terms")
        .doc("agreements")
        .collection("tos")
        .doc(tosId)
        .get()
        .then((doc) => doc.data());

      expect(terms.tosId).toEqual(tosId);
      expect(terms.creationDate).toEqual(creationDate);
      expect(terms.link).toEqual(link);

      expect(terms.customAttributes[0].role).toEqual("publisher");
    });
  });

  describe("get acceptances", () => {
    let user;
    let tosId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      tosId = `tos_v${randomId}`;
    });

    test("can get a acceptance", async () => {
      const link = "www.link.to.terms";
      const creationDate = new Date().toLocaleDateString();

      /** create terms */
      await createTermsFn.call(
        {},
        {
          link,
          tosId,
        },
        { auth: { uid: user.uid } }
      );

      /** accept terms */
      await acceptTermsFn.call({}, { tosId }, { auth: { uid: user.uid } });

      /** get terms */
      const acceptances = await getAcceptances.call(
        {},
        {},
        { auth: { uid: user.uid } }
      );

      expect(acceptances).toBeDefined();
      expect(acceptances[tosId].link).toEqual(link);
      expect(acceptances[tosId].creationDate).toEqual(creationDate);
    });
  });
});
