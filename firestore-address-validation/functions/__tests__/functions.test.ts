const mockEnqueue = jest.fn();

import fft from "firebase-functions-test";
import * as admin from "firebase-admin";
import axios from "axios";
import setupEnvironment from "./setupEnvionment";

import * as functions from "../src";
import { Address } from "../src/types";

const projectId = "demo-test";
const testEnv = fft({ projectId });

setupEnvironment();

const db = admin.firestore();
const { makeDocumentSnapshot } = testEnv.firestore;

jest.mock("firebase-admin/functions", () => {
  return {
    getFunctions: () => {
      return {
        taskQueue: (functionName: any, queueName: any) => {
          return {
            enqueue: mockEnqueue,
          };
        },
      };
    },
  };
});

/** Mocks Apis */
jest.mock("axios");
const mAxios = axios as jest.MockedFunction<typeof axios>;

/** Set global test data */
const address: Address = {
  addressLines: ["test"],
  locality: "",
  regionCode: "GB",
};

/** Set global vars */
const collectionId = "addresses";

describe("firestore address validation", () => {
  describe("validateAddressTrigger", () => {
    it("successfully validates an address", async () => {
      /** Create temporary document in firestore */
      const document = db.collection(collectionId).doc("validationTest");
      await document.set({ address });

      const documentPath = `${collectionId}/${document.id}`;

      /** Setup mocked snapshots */
      mAxios.mockResolvedValue({ data: true });
      const beforeSnap = makeDocumentSnapshot({}, documentPath);
      const afterSnap = makeDocumentSnapshot({ address }, documentPath);

      //@ts-ignore
      const change = testEnv.makeChange(beforeSnap, afterSnap);

      /** Run the function trigger */
      const validateAddress = testEnv.wrap(functions.validateAddressTrigger);
      await validateAddress(change);

      /** Check results */
      const doc = await document.get();

      //@ts-ignore
      const { addressValidity, error } = doc.data();
      expect(addressValidity).toBeTruthy();
      expect(error).toBeUndefined();
    });

    it("successfully re-queues when an UNKNOWN error is encountered", async () => {
      /** Create temporary document in firestore */
      const document = db.collection(collectionId).doc("validationTest");
      await document.set({ address });
      const documentPath = `${collectionId}/${document.id}`;

      /** Setup mocks */
      const err = new axios.AxiosError("message");
      //@ts-ignore
      err.response = {
        data: {
          error: { message: "error found", code: 200, status: "UNKNOWN" },
        },
      };

      //@ts-ignore
      mAxios.mockRejectedValueOnce(err);

      const beforeSnap = makeDocumentSnapshot({}, documentPath);
      const afterSnap = makeDocumentSnapshot({ address }, documentPath);

      //@ts-ignore
      const change = testEnv.makeChange(beforeSnap, afterSnap);

      /** Run the function trigger */
      const validateAddress = testEnv.wrap(functions.validateAddressTrigger);
      await validateAddress(change);

      /** Check results */
      expect(mockEnqueue).toHaveBeenCalledWith(
        {
          address: { addressLines: ["test"], locality: "", regionCode: "GB" },
          docId: "validationTest",
        },
        { scheduleDelaySeconds: 60 }
      );
    });

    it("successfully updates the document to FAILURE on unknown error", async () => {
      /** Create temporary document in firestore */
      const document = db.collection(collectionId).doc("errorTest");
      await document.set({ address });

      const documentPath = `${collectionId}/${document.id}`;

      /** Setup mocks */
      const err = new Error("message");
      //@ts-ignore
      mAxios.mockRejectedValueOnce(err);

      const beforeSnap = makeDocumentSnapshot({}, documentPath);
      const afterSnap = makeDocumentSnapshot({ address }, documentPath);

      //@ts-ignore
      const change = testEnv.makeChange(beforeSnap, afterSnap);

      /** Run the function trigger */
      const validateAddress = testEnv.wrap(functions.validateAddressTrigger);
      await validateAddress(change);

      /** Check results */
      const doc = await document.get();

      //@ts-ignore
      const { addressValidity, error } = doc.data();
      expect(addressValidity).toBeUndefined();
      expect(error.message).toBe("message");
    });
  });

  describe("retryOnUnknownError", () => {
    it("should successfully retry on an unknown error", async () => {
      /** Create temporary document in firestore */
      const document = db.collection(collectionId).doc("retrySuccess");
      await document.set({ error: "An unknown error" });

      /** Setup mocks */
      mAxios.mockResolvedValue(true);

      /** Run the function trigger */
      //@ts-ignore
      const retryFn = testEnv.wrap(functions.retryOnUnknownError);
      await retryFn({ address, docId: document.id });

      /** Check results */
      const doc = await document.get();

      //@ts-ignore
      const { addressValidity, status, error } = doc.data();
      expect(addressValidity).toBe(true);
      expect(status).toBe("SUCCESS");
      expect(error).toBe(undefined);
    });
  });
});
