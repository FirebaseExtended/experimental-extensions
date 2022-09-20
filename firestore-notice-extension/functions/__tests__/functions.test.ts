import setupEnvironment from "./helpers/setupEnvironment";
setupEnvironment();

import * as admin from "firebase-admin";
const fft = require("firebase-functions-test")();

import {
  Acknowledgement,
  AcknowledgementStatus,
  Preference,
  NoticeMetadata,
} from "../src/interface";
import * as funcs from "../src/index";
import * as config from "../src/config";
import { firestore } from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "demo-test" });
}

const auth = admin.auth();

/**prepare collections */
const noticesCollection = firestore().collection(
  config.default.noticeCollectionPath
);

/**prepare collections */
const acknowledgementsCollection = firestore().collection(
  config.default.acknowlegementsCollectionPath
);

/** prepare extension functions */
const acknowledgeNoticeFn = fft.wrap(funcs.acknowledgeNotice);
const unacknowledgeNoticeFn = fft.wrap(funcs.unacknowledgeNotice);
const createNoticeFn = fft.wrap(funcs.createNotice);
const getNoticeFn = fft.wrap(funcs.getNotices);
const getAcknowledgements = fft.wrap(funcs.getAcknowledgements);

describe("functions testing", () => {
  describe("accept notice", () => {
    describe("with a valid notice available", () => {
      let user;
      let noticeId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        noticeId = `notice_v${randomId}`;

        await createNoticeFn.call(
          {},
          {
            link: "www.link.to.notice",
            noticeId,
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );
      });

      test("can accept a notice", async () => {
        await acknowledgeNoticeFn.call(
          {},
          {
            noticeId,
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );

        const acknowledgement = await acknowledgementsCollection
          .doc(user.uid)
          .collection("notices")
          .where("noticeId", "==", noticeId)
          .limit(1)
          .get()
          .then((doc) => doc.docs[0].data());

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.noticeId).toBe(noticeId);
      });

      test("can accept multiple notices", async () => {
        const noticeId_2 = noticeId + "_2";

        /** create a second notice */
        await createNoticeFn.call(
          {},
          {
            link: "www.link.to.notice",
            noticeId: noticeId_2,
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );

        await acknowledgeNoticeFn.call(
          {},
          { noticeId },
          { auth: { uid: user.uid } }
        );
        await acknowledgeNoticeFn.call(
          {},
          { noticeId: noticeId_2 },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];
        const acknowledgements: Acknowledgement = notice;

        expect(acknowledgements).toHaveLength(2);
      });

      test("can decline a notice", async () => {
        await acknowledgeNoticeFn.call(
          {},
          {
            noticeId,
            noticeType: [],
          },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        expect(userRecord).toBeDefined();
        expect(userRecord?.customClaims).toBeDefined();

        const acknowledgement = await acknowledgementsCollection
          .doc(user.uid)
          .collection("notices")
          .where("noticeId", "==", noticeId)
          .limit(1)
          .get()
          .then((doc) => doc.docs[0].data());

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.noticeId).toBeDefined();
        expect(acknowledgement.status).toBe(AcknowledgementStatus.SEEN);
        expect(acknowledgement.creationDate).toBeDefined();
        expect(acknowledgement.acknowledgedDate).toBeNull();
        expect(acknowledgement.unacknowledgedDate).toBeDefined();
      });

      test("successfully appends exisiting custom claims", async () => {
        /** set example custom claims on the user */
        await auth.setCustomUserClaims(user.uid, { foo: "bar" });

        /** accept notice */
        await acknowledgeNoticeFn.call(
          {},
          { noticeId },
          { auth: { uid: user.uid } }
        );

        const userRecord = await auth.getUser(user.uid);

        const notice = userRecord?.customClaims[process.env.EXT_INSTANCE_ID];

        const acknowledgements: Acknowledgement = notice;

        expect(userRecord.customClaims["foo"]).toEqual("bar");
        expect(acknowledgements).toBeDefined();
      });
    });

    describe("without a valid user", () => {
      let user;
      let noticeId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        noticeId = `notice_v${randomId}`;
      });

      test("does not add a notice of service", async () => {
        expect(
          async () =>
            await acknowledgeNoticeFn.call({}, { noticeId, noticeType: [] }, {})
        ).rejects.toThrow("No valid authentication token provided.");
      });
    });

    describe("Without a valid notice", () => {
      let user;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});
      });

      test("does not add a notice of service without a provided noticeId", async () => {
        expect(
          async () =>
            await acknowledgeNoticeFn.call({}, {}, { auth: { uid: user.uid } })
        ).rejects.toThrow("No noticeId provided.");
      });

      test("does not add a notice of service without a exisiting noticeId", async () => {
        expect(
          async () =>
            await acknowledgeNoticeFn.call(
              {},
              { noticeId: "unknown", noticeType: [] },
              { auth: { uid: user.uid } }
            )
        ).rejects.toThrow("Notice document does not exist");
      });
    });

    describe("can accept notice with preferences", () => {
      let user;
      let noticeId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        noticeId = `notice_v${randomId}`;
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
            noticeId,
          },
          { auth: { uid: user.uid } }
        );

        /** accept notice with preferences selected */
        await acknowledgeNoticeFn.call(
          {},
          {
            noticeId,
            noticeType: "exmaple",
            preferences: [{ ...Analytics, active: true }],
            acknowledged: true,
          },
          { auth: { uid: user.uid } }
        );

        const acknowledgement = await acknowledgementsCollection
          .doc(user.uid)
          .collection("notices")
          .where("noticeId", "==", noticeId)
          .limit(1)
          .get()
          .then((doc) => doc.docs[0].data());

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.noticeId).toBeDefined();
        expect(acknowledgement.preferences[0]).toBeDefined();
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
            noticeId,
          },
          { auth: { uid: user.uid } }
        );

        /** accept notice with preferences selected */
        await acknowledgeNoticeFn.call(
          {},
          {
            noticeId,
            preferences: [{ ...Analytics, value: "_gat" }],
            acknowledged: true,
          },
          { auth: { uid: user.uid } }
        );

        const acknowledgement = await acknowledgementsCollection
          .doc(user.uid)
          .collection("notices")
          .where("noticeId", "==", noticeId)
          .limit(1)
          .get()
          .then((doc) => doc.docs[0].data());

        expect(acknowledgement).toBeDefined();
        expect(acknowledgement.noticeId).toBeDefined();
        expect(acknowledgement.preferences[0].value).toEqual("_gat");
      });
    });

    describe("acknowledgment status", () => {
      let user;
      let noticeId;

      beforeEach(async () => {
        /** create example user */
        user = await auth.createUser({});

        const randomId = Math.random().toString(36).substring(2, 15);
        noticeId = `notice_v${randomId}`;
      });

      test("can accept a notice as ACCEPTED", async () => {
        const noticeType = "example_notice";
        await createNoticeFn.call(
          {},
          { link: "www.link.to.notice", noticeId, noticeType },
          { auth: { uid: user.uid } }
        );

        await acknowledgeNoticeFn.call(
          {},
          { noticeId, noticeType, status: AcknowledgementStatus.ACCEPTED },
          { auth: { uid: user.uid } }
        );

        const acknowledgement = await acknowledgementsCollection
          .doc(user.uid)
          .collection("notices")
          .where("noticeId", "==", noticeId)
          .limit(1)
          .get()
          .then((doc) => doc.docs[0].data());

        expect(acknowledgement.status).toBe(AcknowledgementStatus.ACCEPTED);
        expect(acknowledgement.unacknowledgedDate).toBeNull();
        expect(acknowledgement.acknowledgedDate).toBeDefined();
      });
    });
  });

  describe("get notices", () => {
    let user;
    let noticeId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      noticeId = `notice_v${randomId}`;
    });

    test("can get a notice of service", async () => {
      await createNoticeFn.call(
        {},
        {
          link: "www.link.to.notice",
          noticeId,
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
        { noticeId },
        { auth: { uid: user.uid } }
      );

      expect(notice).toBeDefined();
      expect(notice?.link).toBeDefined();
      expect(notice?.noticeId).toBeDefined();
      expect(notice?.creationDate).toBeDefined();
      expect(notice?.noticeType[0].role).toBe("publisher");
    });

    test("can get a notice of service by noticeId", async () => {
      await createNoticeFn.call(
        {},
        {
          link: "www.link.to.notice",
          noticeId,
          noticeType: [],
        },
        { auth: { uid: user.uid } }
      );

      const notice = await getNoticeFn.call(
        {},
        { noticeId },
        { auth: { uid: user.uid } }
      );

      expect(notice).toBeDefined();
      expect(notice?.link).toBeDefined();
      expect(notice?.noticeId).toBeDefined();
      expect(notice?.creationDate).toBeDefined();
    });

    test("can get a notice with a custom filter", async () => {
      await createNoticeFn.call(
        {},
        {
          link: "www.test.com",
          noticeId,
          noticeType: "publisher",
        } as NoticeMetadata,
        { auth: { uid: user.uid } }
      );

      const notice = await getNoticeFn.call(
        {},
        { custom_filter: { role: "publisher" } },
        { auth: { uid: user.uid } }
      );

      const toCheck = notice.filter(($) => $.noticeId === noticeId)[0];

      expect(toCheck).toBeDefined();
      expect(toCheck?.link).toBeDefined();
      expect(toCheck?.noticeId).toBeDefined();
      expect(toCheck?.creationDate).toBeDefined();
      expect(toCheck?.noticeType).toEqual("publisher");
    });

    xtest("can get the latest notice", async () => {});

    xtest("can get all notices when no valid filters provided", async () => {});
  });

  describe("create notice", () => {
    let user;
    let noticeId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      noticeId = `notice_v${randomId}`;
    });

    test("can create a notice", async () => {
      const title = "test notice";
      const link = "www.link.to.notice";
      const noticeType = [{ role: "publisher" }];

      await createNoticeFn.call(
        {},
        { title, noticeId, link, noticeType },
        { auth: { uid: "test" } }
      );

      const notice = await noticesCollection
        .doc(noticeId)
        .get()
        .then((doc) => doc.data());

      expect(notice.noticeId).toEqual(noticeId);
      expect(notice.link).toEqual(link);
      expect(notice.noticeType).toEqual(noticeType);

      expect(notice.creationDate).toBeDefined();
      expect(notice.acknowledgedDate).toBeUndefined();
    });

    test("can create a notice with a basic preference", async () => {
      const title = "test notice";
      const link = "www.link.to.notice";
      const Analytics: Preference = {
        name: "_ga",
        description: "Google Analytics",
        required: true,
        value: "_ga",
      };
      const preferences = [Analytics];

      await createNoticeFn.call(
        {},
        { title, noticeId, link, preferences } as NoticeMetadata,
        {
          auth: { uid: "test" },
        }
      );

      const notice = await noticesCollection
        .doc(noticeId)
        .get()
        .then((doc) => doc.data());

      expect(notice.noticeId).toEqual(noticeId);
      expect(notice.link).toEqual(link);

      expect(notice.preferences[0].name).toEqual("_ga");
      expect(notice.creationDate).toBeDefined();
      expect(notice.acknowledgedDate).toBeUndefined();
    });

    test("should not throw an error when an invalid notice type has not been provided", async () => {
      const link = "www.link.to.notice";
      const creationDate = new Date().toLocaleDateString();

      await createNoticeFn.call(
        {},
        { noticeId, link, creationDate },
        { auth: { uid: "test" } }
      );
    });
  });

  describe("get acknowledgements", () => {
    let user;
    let noticeId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      noticeId = `notice_v${randomId}`;
    });

    test("can get an acknowledgment", async () => {
      const link = "www.link.to.notice";

      /** create notice */
      await createNoticeFn.call(
        {},
        {
          link,
          noticeId,
          noticeType: [],
        },
        { auth: { uid: user.uid } }
      );

      /** accept notice */
      await acknowledgeNoticeFn.call(
        {},
        { noticeId },
        { auth: { uid: user.uid } }
      );

      /** get notice */
      const acknowledgements = await getAcknowledgements.call(
        {},
        { noticeId },
        { auth: { uid: user.uid } }
      );

      expect(acknowledgements).toBeDefined();
      expect(acknowledgements[0].creationDate).toBeDefined();
      expect(acknowledgements[0].acknowledgedDate).toBeDefined();
    });
  });

  describe("get acknowledgements", () => {
    let user;
    let noticeId;

    beforeEach(async () => {
      /** create example user */
      user = await auth.createUser({});

      const randomId = Math.random().toString(36).substring(2, 15);
      noticeId = `notice_v${randomId}`;
    });

    test("can unacknowledge an exisitng acknowledgement notice", async () => {
      const link = "www.link.to.notice";

      /** create notice */
      await createNoticeFn.call(
        {},
        {
          link,
          noticeId,
          noticeType: [],
        },
        { auth: { uid: user.uid } }
      );

      /** acknowledge Notice notice */
      await acknowledgeNoticeFn.call(
        {},
        { noticeId },
        { auth: { uid: user.uid } }
      );

      /** Check Custom Claims after acknowledgement  */
      const beforeUserRecord = await auth.getUser(user.uid);
      const claims =
        beforeUserRecord?.customClaims[process.env.EXT_INSTANCE_ID];

      expect(claims).toBeDefined();
      expect(claims.length).toEqual(1);

      /** unacknowledge Notice notice */
      await unacknowledgeNoticeFn.call(
        {},
        { noticeId },
        { auth: { uid: user.uid } }
      );

      /** get notice */
      const acknowledgements = await getAcknowledgements.call(
        {},
        { noticeId },
        { auth: { uid: user.uid } }
      );

      expect(acknowledgements).toBeDefined();
      expect(acknowledgements[0].creationDate).toBeDefined();
      expect(acknowledgements[0].unacknowledgedDate).toBeDefined();

      /** Check Custom Claims after unacknowledgement  */
      const userRecord = await auth.getUser(user.uid);

      expect(userRecord).toBeDefined();
      expect(
        userRecord?.customClaims[process.env.EXT_INSTANCE_ID].length
      ).toEqual(0);
    });

    test("can unacknowledge a new notice", async () => {
      const link = "www.link.to.notice";

      /** create notice */
      await createNoticeFn.call(
        {},
        {
          link,
          noticeId,
          noticeType: [],
        },
        { auth: { uid: user.uid } }
      );

      /** unacknowledge Notice notice */
      await unacknowledgeNoticeFn.call(
        {},
        { noticeId },
        { auth: { uid: user.uid } }
      );

      /** get notice */
      const acknowledgements = await getAcknowledgements.call(
        {},
        { noticeId },
        { auth: { uid: user.uid } }
      );

      expect(acknowledgements).toBeDefined();
      expect(acknowledgements[0].creationDate).toBeDefined();
      expect(acknowledgements[0].unacknowledgedDate).toBeDefined();

      /** Check Custom Claims  */
      const userRecord = await auth.getUser(user.uid);

      expect(userRecord).toBeDefined();
      expect(userRecord?.customClaims).toBeUndefined();
    });
  });
});
