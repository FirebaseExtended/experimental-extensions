import * as fft from "firebase-functions-test";
const testEnv = fft({
  projectId: "demo-test",
});

import * as admin from "firebase-admin";
import setupEnvironment from "./helpers/setupEnvironment";
//@ts-ignore
import config from "../src/config";
import { addProcessingDocuments, clearFirestore } from "./helpers";

const functions = require("../src/index");

setupEnvironment();
jest.spyOn(admin, "initializeApp").mockImplementation();

/** Setup test environment */
const db = admin.firestore();

/** Setup Mocks */
jest.mock("../src/config", () => ({
  default: {
    schedule: "every 1 minutes",
    mergeWrite: "true",
    queueCollection: "queued_writes",
    targetCollection: "target_collection",
    stalenessThresholdSeconds: 0,
    cleanup: "KEEP",
  },
}));

describe("firestore-schedule-writes", () => {
  afterEach(async () => {
    /** Clear mocks */
    await jest.clearAllMocks();
  });

  describe("resetStuckWrites", () => {
    describe("when using a single write", () => {
      beforeEach(async () => {
        /** Clear Firestore data */
        await clearFirestore();

        /**
         * Add processing documents
         * 150 axceeds the 100 batch size,
         * causes the function to run multiple times
         * */
        await addProcessingDocuments(1, "PROCESSING", {
          leaseExpireTime: admin.firestore.Timestamp.now(),
        });
      }, 60000);

      it("should reset a single stuck write", async () => {
        /** Run function */
        const wrapped = testEnv.wrap(functions.deliverWrites);
        await wrapped({});

        /** Wait 5 seconds */
        await new Promise((resolve) => setTimeout(resolve, 12000));

        /** Asset documents */
        const snap = await db.collection(config.queueCollection).get();
        const data = snap.docs[0].data();

        expect(data.state).toBe("PENDING");
      }, 60000);
    });

    describe("when using batch writes", () => {
      beforeEach(async () => {
        /** Clear Firestore data */
        await clearFirestore();

        /**
         * Add processing documents
         * 150 axceeds the 100 batch size,
         * causes the function to run multiple times
         * */
        await addProcessingDocuments(101, "PROCESSING", {
          leaseExpireTime: admin.firestore.Timestamp.now(),
        });
      }, 60000);

      it("should resets multiple batches of stuck writes", async () => {
        /** Run function */
        const wrapped = testEnv.wrap(functions.deliverWrites);
        await wrapped({});

        /** Wait 5 seconds */
        await new Promise((resolve) => setTimeout(resolve, 5000));

        /** Assert documents */
        const snap = await db.collection(config.queueCollection).get();

        for (const doc of snap.docs) {
          const data = doc.data();
          expect(data.state).toBe("PENDING");
        }
      }, 60000);
    });
  });

  describe("fetchAndProcess", () => {
    describe("single writes", () => {
      beforeEach(async () => {
        /** Clear Firestore data */
        await clearFirestore();

        /** Add processing documents */
        await addProcessingDocuments(1, "PENDING", {
          deliverTime: admin.firestore.Timestamp.now(),
        });
      });

      test("should process a single write", async () => {
        /** Run function */
        const wrapped = testEnv.wrap(functions.deliverWrites);
        await wrapped({});

        /** Wait 5 seconds */
        await new Promise((resolve) => setTimeout(resolve, 5000));

        /** Assert Queue collections */
        const snap = await db.collection(config.queueCollection).get();
        const data = snap.docs[0].data();
        expect(data.state).toBe("DELIVERED");
        expect(data.attempts).toBe(1);

        /** Assert tagret collections */
        const queueSnap = await db
          .collection(config.targetCollection || "")
          .get();
        const QueueData = queueSnap.docs[0].data();
        expect(QueueData.document).toBeDefined();
      }, 60000);
    });

    describe("batch writes", () => {
      beforeEach(async () => {
        /** Clear Firestore data */
        await clearFirestore();

        /** Add processing documents */
        await addProcessingDocuments(101, "PENDING", {
          deliverTime: admin.firestore.Timestamp.now(),
        });
      }, 60000);

      test("should process multiple batches", async () => {
        /** Run function */
        const wrapped = testEnv.wrap(functions.deliverWrites);
        await wrapped({});

        /** Wait 5 seconds */
        await new Promise((resolve) => setTimeout(resolve, 5000));

        /** Asset documents */
        const snap = await db.collection(config.queueCollection).get();

        for (const doc of snap.docs) {
          const data = doc.data();
          expect(data.state).toBe("DELIVERED");
          expect(data.attempts).toBe(1);
        }

        /** Assert tagret collections */
        const queueSnap = await db
          .collection(config.targetCollection || "")
          .get();

        for (const doc of queueSnap.docs) {
          const data = doc.data();
          expect(data.document).toBeDefined();
        }
      }, 1200000);
    });
  });

  describe("stale writes", () => {
    beforeEach(async () => {
      /** Clear Firestore data */
      await clearFirestore();

      /** set invalid aftrer time */
      config.stalenessThresholdSeconds = 10;

      /** Add one minute to timestamp */
      const now = admin.firestore.Timestamp.now();
      const deliverTime = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + 60 * 1000
      );

      /** Add processing documents */
      await addProcessingDocuments(1, "PENDING", {
        deliverTime,
      });
    });

    test("should not process stale records", async () => {
      /** Run function */
      const wrapped = testEnv.wrap(functions.deliverWrites);
      await wrapped({});

      /** Wait 5 seconds */
      await new Promise((resolve) => setTimeout(resolve, 5000));

      /** Asset documents */
      const snap = await db.collection(config.queueCollection).get();
      const data = snap.docs[0].data();

      expect(data.state).toBe("PENDING");
    }, 60000);
  });

  describe("invalid after time", () => {
    beforeEach(async () => {
      /** Clear Firestore data */
      await clearFirestore();

      /** set invalid aftrer time */
      config.stalenessThresholdSeconds = 1;

      /** Invalidate time */
      const invalidAfterTime = admin.firestore.Timestamp.now();

      /** Add processing documents */
      await addProcessingDocuments(1, "PENDING", {
        invalidAfterTime,
      });

      /** Wait one second */
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    test("should not process if the record is invalid after a specified date", async () => {
      /** Run function */
      const wrapped = testEnv.wrap(functions.deliverWrites);
      await wrapped({});

      /** Wait 5 seconds */
      await new Promise((resolve) => setTimeout(resolve, 5000));

      /** Asset documents */
      const snap = await db.collection(config.queueCollection).get();
      const data = snap.docs[0].data();

      expect(data.state).toBe("PENDING");
    }, 60000);
  });
});
