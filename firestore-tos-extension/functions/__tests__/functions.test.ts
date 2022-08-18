import setupEnvironment from "./helpers/setupEnvironment";
setupEnvironment();

import * as admin from "firebase-admin";
const fft = require("firebase-functions-test")();

import {
  Acknowledgement,
  AcknowledgementStatus,
  Preference,
} from "../src/interface";
import * as funcs from "../src/index";
import * as config from "../src/config";
import { firestore } from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

const auth = admin.auth();

/**prepare collections */
const noticesCollection = firestore().collection(config.default.collectionPath);

/** prepare extension functions */
const acceptNoticeFn = fft.wrap(funcs.acceptNotice);
const createNoticeFn = fft.wrap(funcs.createNotice);
const getNoticeFn = fft.wrap(funcs.getNotices);
const getAcknowledgements = fft.wrap(funcs.getAcknowledgements);

describe("functions testing", () => {
  describe("accept notice", () => {
    describe("with a valid notice available", () => {
      let user;
      let tosId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        tosId = `tos_v${randomId}`;

        await createNoticeFn.call(
          {},
          {
            link: "www.link.to.notice",
            tosId,
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );
      });

      test("can accept a notice", async () => {
        await acceptNoticeFn.call(
          {},
          {
            tosId,
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        expect(userRecord).toBeDefined();
        expect(userRecord?.customClaims).toBeDefined();

        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        expect(notice).toBeDefined();
        expect(notice.length).toBe(1);

        const acknowledgement: Acknowledgement = notice[0];

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.tosId).toBeDefined();
        expect(acknowledgement.status).toBe(AcknowledgementStatus.SEEN);
        expect(acknowledgement.creationDate).toBeDefined();
        expect(acknowledgement.acknowledgedDate).toBeDefined();
        expect(acknowledgement.unacknowledgedDate).toBeNull();
        expect(acknowledgement.status).toBe(AcknowledgementStatus.SEEN);
      });

      test("can accept multiple notices", async () => {
        const tosId_2 = tosId + "_2";

        /** create a second agreement */
        await createNoticeFn.call(
          {},
          {
            link: "www.link.to.notice",
            tosId: tosId_2,
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );

        await acceptNoticeFn.call({}, { tosId }, { auth: { uid: user.uid } });
        await acceptNoticeFn.call(
          {},
          { tosId: tosId_2 },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];
        const acknowledgements: Acknowledgement = notice;

        expect(acknowledgements).toHaveLength(2);
      });

      test("can decline a notice", async () => {
        await acceptNoticeFn.call(
          {},
          {
            tosId,
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        expect(userRecord).toBeDefined();
        expect(userRecord?.customClaims).toBeDefined();

        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        expect(notice).toBeDefined();
        expect(notice.length).toBe(1);

        const acknowledgement: Acknowledgement = notice[0];

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.tosId).toBeDefined();
        expect(acknowledgement.status).toBe(AcknowledgementStatus.SEEN);
        expect(acknowledgement.creationDate).toBeDefined();
        expect(acknowledgement.acknowledgedDate).toBeNull();
        expect(acknowledgement.unacknowledgedDate).toBeDefined();
      });

      test("successfully appends exisiting custom claims", async () => {
        /** set example custom claims on the user */
        await auth.setCustomUserClaims(user.uid, { foo: "bar" });

        /** accept notice */
        await acceptNoticeFn.call({}, { tosId }, { auth: { uid: user.uid } });

        const userRecord = await auth.getUser(user.uid);

        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];
        const acknowledgements: Acknowledgement = notice;

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

      test("does not add a notice of service", async () => {
        expect(
          async () =>
            await acceptNoticeFn.call({}, { tosId, noticeType: [] }, {})
        ).rejects.toThrow("No valid authentication token provided.");
      });
    });

    describe("Without a valid notice of service agreement", () => {
      let user;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});
      });

      test("does not add a notice of service without a provided tosId", async () => {
        expect(
          async () =>
            await acceptNoticeFn.call({}, {}, { auth: { uid: user.uid } })
        ).rejects.toThrow("No tosId provided.");
      });

      test("does not add a notice of service without a exisiting tosId", async () => {
        await acceptNoticeFn.call(
          {},
          { tosId: "unknown", noticeType: [] },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        const claims = userRecord?.customClaims;

        expect(claims).toBeUndefined();
      });
    });

    describe("can accept notice with preferences", () => {
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

        /** create notice with a preference */
        await createNoticeFn.call(
          {},
          {
            link: "www.link.to.notice",
            tosId,
            noticeType: [{ preferences: [Analytics] }],
          },
          { auth: { uid: user.uid } }
        );

        /** accept notice with preferences selected */
        await acceptNoticeFn.call(
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

        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        expect(notice).toBeDefined();
        expect(notice.length).toBe(1);

        const acknowledgement: Acknowledgement = notice[0];

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

        /** create notice with a preference */
        await createNoticeFn.call(
          {},
          {
            link: "www.link.to.notice",
            tosId,
            noticeType: [{ preferences: [Analytics] }],
          },
          { auth: { uid: user.uid } }
        );

        /** accept notice with preferences selected */
        await acceptNoticeFn.call(
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

        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        expect(notice).toBeDefined();
        expect(notice.length).toBe(1);

        const acknowledgement: Acknowledgement = notice[0];

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.tosId).toBeDefined();
        expect(acknowledgement.noticeType[0].preferences[0].value).toEqual(
          "_gat"
        );
      });
    });

    describe("acknowledgment status", () => {
      let user;
      let tosId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        tosId = `tos_v${randomId}`;
      });

      test("can accept a notice as ACCEPTED", async () => {
        const noticeType = [{ preferences: [] }];

        await createNoticeFn.call(
          {},
          { link: "www.link.to.notice", tosId, noticeType },
          { auth: { uid: user.uid } }
        );

        await acceptNoticeFn.call(
          {},
          { tosId, noticeType, status: AcknowledgementStatus.ACCEPTED },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);
        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        console.log("notice >>>>>", notice);

        const acknowledgement: Acknowledgement = notice.filter(
          ($) => $.tosId === tosId
        )[0];

        console.log("acknowledgement >>>>>", acknowledgement);

        expect(acknowledgement.status).toBe(AcknowledgementStatus.ACCEPTED);
        expect(acknowledgement.unacknowledgedDate).toBeNull();
        expect(acknowledgement.acknowledgedDate).toBeDefined();
      });
    });
  });

  describe("get notices", () => {
    let user;
    let tosId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      tosId = `tos_v${randomId}`;
    });

    test("can get a notice of service", async () => {
      await createNoticeFn.call(
        {},
        {
          link: "www.link.to.notice",
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

      const notice = await getNoticeFn.call(
        {},
        { tosId },
        { auth: { uid: user.uid } }
      );

      expect(notice).toBeDefined();
      expect(notice?.link).toBeDefined();
      expect(notice?.tosId).toBeDefined();
      expect(notice?.creationDate).toBeDefined();
      expect(notice?.noticeType[0].role).toBe("publisher");
    });

    test("can get a notice of service by tosId", async () => {
      await createNoticeFn.call(
        {},
        {
          link: "www.link.to.notice",
          tosId,
          noticeType: [],
        },
        { auth: { uid: user.uid } }
      );

      const notice = await getNoticeFn.call(
        {},
        { tosId },
        { auth: { uid: user.uid } }
      );

      expect(notice).toBeDefined();
      expect(notice?.link).toBeDefined();
      expect(notice?.tosId).toBeDefined();
      expect(notice?.creationDate).toBeDefined();
    });

    test("can get a notice with a custom filter", async () => {
      await createNoticeFn.call(
        {},
        {
          link: "www.test.com",
          tosId,
          noticeType: [{ role: "publisher" }],
        },
        { auth: { uid: user.uid } }
      );

      const notice = await getNoticeFn.call(
        {},
        { custom_filter: { role: "publisher" } },
        { auth: { uid: user.uid } }
      );

      const toCheck = notice.filter(($) => $.tosId === tosId)[0];

      expect(toCheck).toBeDefined();
      expect(toCheck?.link).toBeDefined();
      expect(toCheck?.tosId).toBeDefined();
      expect(toCheck?.creationDate).toBeDefined();
      expect(toCheck?.noticeType[0].role).toEqual("publisher");
    });

    xtest("can get the latest notice", async () => {});

    xtest("can get all notices when no valid filters provided", async () => {});
  });

  describe("create notice", () => {
    let user;
    let tosId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      tosId = `tos_v${randomId}`;
    });

    test("can create a notice", async () => {
      const link = "www.link.to.notice";
      const noticeType = [{ role: "publisher" }];

      await createNoticeFn.call(
        {},
        { tosId, link, noticeType },
        { auth: { uid: "test" } }
      );

      const notice = await noticesCollection
        .doc("agreements")
        .collection("tos")
        .doc(tosId)
        .get()
        .then((doc) => doc.data());

      expect(notice.tosId).toEqual(tosId);
      expect(notice.link).toEqual(link);
      expect(notice.noticeType).toEqual(noticeType);

      expect(notice.creationDate).toBeDefined();
      expect(notice.acknowledgedDate).toBeUndefined();
    });

    test("can create a notice with a basic preference", async () => {
      const link = "www.link.to.notice";
      const Analytics: Preference = {
        name: "_ga",
        description: "Google Analytics",
        required: true,
        value: "_ga",
      };
      const noticeType = [{ role: "publisher", preferences: [Analytics] }];

      await createNoticeFn.call(
        {},
        { tosId, link, noticeType },
        { auth: { uid: "test" } }
      );

      const notice = await noticesCollection
        .doc("agreements")
        .collection("tos")
        .doc(tosId)
        .get()
        .then((doc) => doc.data());

      expect(notice.tosId).toEqual(tosId);
      expect(notice.link).toEqual(link);
      expect(notice.noticeType).toEqual(noticeType);

      expect(notice.noticeType[0].preferences[0].name).toEqual("_ga");
      expect(notice.creationDate).toBeDefined();
      expect(notice.acknowledgedDate).toBeUndefined();
    });

    test("can create a notice with a optional preference", async () => {
      const link = "www.link.to.notice";
      const Analytics: Preference = {
        name: "_ga",
        description: "Google Analytics",
        required: true,
        options: ["_ga", "_gat"],
      };
      const noticeType = [{ role: "publisher", preferences: [Analytics] }];

      await createNoticeFn.call(
        {},
        { tosId, link, noticeType },
        { auth: { uid: "test" } }
      );

      const notice = await admin
        .firestore()
        .collection("notices")
        .doc("agreements")
        .collection("tos")
        .doc(tosId)
        .get()
        .then((doc) => doc.data());

      expect(notice.tosId).toEqual(tosId);
      expect(notice.link).toEqual(link);
      expect(notice.noticeType).toEqual(noticeType);

      expect(notice.noticeType[0].preferences[0].options.length).toEqual(2);
      expect(notice.creationDate).toBeDefined();
      expect(notice.acknowledgedDate).toBeUndefined();
    });

    test("should throw an error when a valid notice type has not been provided", async () => {
      const link = "www.link.to.notice";
      const creationDate = new Date().toLocaleDateString();

      expect(
        async () =>
          await createNoticeFn.call(
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
      const link = "www.link.to.notice";

      /** create notice */
      await createNoticeFn.call(
        {},
        {
          link,
          tosId,
          noticeType: [],
        },
        { auth: { uid: user.uid } }
      );

      /** accept notice */
      await acceptNoticeFn.call({}, { tosId }, { auth: { uid: user.uid } });

      /** get notice */
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
