import setupEnvironment from "./helpers/setupEnvironment";
setupEnvironment();

import * as admin from "firebase-admin";
const fft = require("firebase-functions-test")();

import { Acknowledgement, Preference } from "../src/interface";
import * as funcs from "../src/index";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

const auth = admin.auth();

/** prepare extension functions */
const acceptTermsFn = fft.wrap(funcs.acceptTerms);
const createTermsFn = fft.wrap(funcs.createTerms);
const getTermsFn = fft.wrap(funcs.getTerms);
const getAcknowledgements = fft.wrap(funcs.getAcknowledgements);

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
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );
      });

      test("can accept a terms of service", async () => {
        await acceptTermsFn.call(
          {},
          {
            tosId,
            noticeType: [],
            acknowledged: true,
          },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        expect(userRecord).toBeDefined();
        expect(userRecord?.customClaims).toBeDefined();

        const terms = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        expect(terms).toBeDefined();
        expect(terms.length).toBe(1);

        const acknowledgement: Acknowledgement = terms[0];

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.tosId).toBeDefined();
        expect(acknowledgement.acknowledged).toBeTruthy();
        expect(acknowledgement.creationDate).toBeDefined();
        expect(acknowledgement.acknowledgedDate).toBeDefined();
        expect(acknowledgement.unacknowledgedDate).toBeNull();
      });

      test("can accept multiple terms of service agreements", async () => {
        const tosId_2 = tosId + "_2";

        /** create a second agreement */
        await createTermsFn.call(
          {},
          {
            link: "www.link.to.terms",
            tosId: tosId_2,
            noticeType: [],
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
        const acknowledgements: Acknowledgement = terms;

        expect(acknowledgements).toHaveLength(2);
      });

      test("can decline a terms of service", async () => {
        await acceptTermsFn.call(
          {},
          {
            tosId,
            noticeType: [],
            acknowledged: false,
          },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        expect(userRecord).toBeDefined();
        expect(userRecord?.customClaims).toBeDefined();

        const terms = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        expect(terms).toBeDefined();
        expect(terms.length).toBe(1);

        const acknowledgement: Acknowledgement = terms[0];

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.tosId).toBeDefined();
        expect(acknowledgement.acknowledged).toBeFalsy();
        expect(acknowledgement.creationDate).toBeDefined();
        expect(acknowledgement.acknowledgedDate).toBeNull();
        expect(acknowledgement.unacknowledgedDate).toBeDefined();
      });

      test("successfully appends exisiting custom claims", async () => {
        /** set example custom claims on the user */
        await auth.setCustomUserClaims(user.uid, { foo: "bar" });

        /** accept terms */
        await acceptTermsFn.call({}, { tosId }, { auth: { uid: user.uid } });

        const userRecord = await auth.getUser(user.uid);

        const terms = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];
        const acknowledgements: Acknowledgement = terms;

        expect(userRecord.customClaims["foo"]).toEqual("bar");
        expect(acknowledgements).toBeDefined();
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
        expect(
          async () =>
            await acceptTermsFn.call({}, { tosId, noticeType: [] }, {})
        ).rejects.toThrow("No valid authentication token provided.");
      });
    });

    describe("Without a valid terms of service agreement", () => {
      let user;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});
      });

      test("does not add a terms of service without a provided tosId", async () => {
        expect(
          async () =>
            await acceptTermsFn.call({}, {}, { auth: { uid: user.uid } })
        ).rejects.toThrow("No tosId provided.");
      });

      test("does not add a terms of service without a exisiting tosId", async () => {
        await acceptTermsFn.call(
          {},
          { tosId: "unknown", noticeType: [] },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        const claims = userRecord?.customClaims;

        expect(claims).toBeUndefined();
      });
    });

    describe("can accept terms with preferences", () => {
      let user;
      let tosId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        tosId = `tos_v${randomId}`;
      });

      test("accept a standard preference", async () => {
        const Analytics: Preference = {
          name: "_ga",
          description: "Google Analytics",
          required: true,
        };

        /** create terms with a preference */
        await createTermsFn.call(
          {},
          {
            link: "www.link.to.terms",
            tosId,
            noticeType: [{ preferences: [Analytics] }],
          },
          { auth: { uid: user.uid } }
        );

        /** accept terms with preferences selected */
        await acceptTermsFn.call(
          {},
          {
            tosId,
            noticeType: [{ preferences: [{ ...Analytics, active: true }] }],
            acknowledged: true,
          },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        expect(userRecord).toBeDefined();
        expect(userRecord?.customClaims).toBeDefined();

        const terms = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        expect(terms).toBeDefined();
        expect(terms.length).toBe(1);

        const acknowledgement: Acknowledgement = terms[0];

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.tosId).toBeDefined();
        expect(acknowledgement.noticeType[0].preferences[0]).toBeDefined();
      });

      test("accept an optional preference", async () => {
        const Analytics: Preference = {
          name: "_ga",
          description: "Google Analytics",
          options: ["_ga", "_gat"],
          required: true,
        };

        /** create terms with a preference */
        await createTermsFn.call(
          {},
          {
            link: "www.link.to.terms",
            tosId,
            noticeType: [{ preferences: [Analytics] }],
          },
          { auth: { uid: user.uid } }
        );

        /** accept terms with preferences selected */
        await acceptTermsFn.call(
          {},
          {
            tosId,
            noticeType: [{ preferences: [{ ...Analytics, value: "_gat" }] }],
            acknowledged: true,
          },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        expect(userRecord).toBeDefined();
        expect(userRecord?.customClaims).toBeDefined();

        const terms = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        expect(terms).toBeDefined();
        expect(terms.length).toBe(1);

        const acknowledgement: Acknowledgement = terms[0];

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.tosId).toBeDefined();
        expect(acknowledgement.noticeType[0].preferences[0].value).toEqual(
          "_gat"
        );
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
          noticeType: [
            {
              role: "publisher",
            },
          ],
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
      expect(terms?.noticeType[0].role).toBe("publisher");
    });

    test("can get a terms of service by tosId", async () => {
      await createTermsFn.call(
        {},
        {
          link: "www.link.to.terms",
          tosId,
          noticeType: [],
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
          noticeType: [{ role: "publisher" }],
        },
        { auth: { uid: user.uid } }
      );

      const terms = await getTermsFn.call(
        {},
        { custom_filter: { role: "publisher" } },
        { auth: { uid: user.uid } }
      );

      const toCheck = terms.filter(($) => $.tosId === tosId)[0];

      expect(toCheck).toBeDefined();
      expect(toCheck?.link).toBeDefined();
      expect(toCheck?.tosId).toBeDefined();
      expect(toCheck?.creationDate).toBeDefined();
      expect(toCheck?.noticeType[0].role).toEqual("publisher");
    });

    xtest("can get the latest terms", async () => {});

    xtest("can get all terms when no valid filters provided", async () => {});
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
      const noticeType = [{ role: "publisher" }];

      await createTermsFn.call(
        {},
        { tosId, link, noticeType },
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
      expect(terms.link).toEqual(link);
      expect(terms.noticeType).toEqual(noticeType);

      expect(terms.creationDate).toBeDefined();
      expect(terms.acknowledgedDate).toBeUndefined();
    });

    test("can create a terms of service with a basic preference", async () => {
      const link = "www.link.to.terms";
      const Analytics: Preference = {
        name: "_ga",
        description: "Google Analytics",
        required: true,
        value: "_ga",
      };
      const noticeType = [{ role: "publisher", preferences: [Analytics] }];

      await createTermsFn.call(
        {},
        { tosId, link, noticeType },
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
      expect(terms.link).toEqual(link);
      expect(terms.noticeType).toEqual(noticeType);

      expect(terms.noticeType[0].preferences[0].name).toEqual("_ga");
      expect(terms.creationDate).toBeDefined();
      expect(terms.acknowledgedDate).toBeUndefined();
    });

    test("can create a terms of service with a optional preference", async () => {
      const link = "www.link.to.terms";
      const Analytics: Preference = {
        name: "_ga",
        description: "Google Analytics",
        required: true,
        options: ["_ga", "_gat"],
      };
      const noticeType = [{ role: "publisher", preferences: [Analytics] }];

      await createTermsFn.call(
        {},
        { tosId, link, noticeType },
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
      expect(terms.link).toEqual(link);
      expect(terms.noticeType).toEqual(noticeType);

      expect(terms.noticeType[0].preferences[0].options.length).toEqual(2);
      expect(terms.creationDate).toBeDefined();
      expect(terms.acknowledgedDate).toBeUndefined();
    });

    test("should throw an error when a valid notice type has not been provided", async () => {
      const link = "www.link.to.terms";
      const creationDate = new Date().toLocaleDateString();

      expect(
        async () =>
          await createTermsFn.call(
            {},
            { tosId, link, creationDate },
            { auth: { uid: "test" } }
          )
      ).rejects.toThrow("Invalid notice type");
    });
  });

  describe("get acknowledgements", () => {
    let user;
    let tosId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      tosId = `tos_v${randomId}`;
    });

    test("can get an acknowledgment", async () => {
      const link = "www.link.to.terms";

      /** create terms */
      await createTermsFn.call(
        {},
        {
          link,
          tosId,
          noticeType: [],
        },
        { auth: { uid: user.uid } }
      );

      /** accept terms */
      await acceptTermsFn.call({}, { tosId }, { auth: { uid: user.uid } });

      /** get terms */
      const acknowledgements = await getAcknowledgements.call(
        {},
        { tosId },
        { auth: { uid: user.uid } }
      );

      console.log(acknowledgements);

      expect(acknowledgements).toBeDefined();
      expect(acknowledgements[0].creationDate).toBeDefined();
      expect(acknowledgements[0].acknowledgedDate).toBeDefined();
    });
  });
});
