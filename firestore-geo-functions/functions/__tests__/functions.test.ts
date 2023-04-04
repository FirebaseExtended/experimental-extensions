const fft = require("firebase-functions-test");
const testEnv = fft({ projectId: "demo-test" });
import setupEnvironment from "./helpers/setupEnvironment";
import { getFunctions, getExtensions } from "./__mocks__/functions";

import * as admin from "firebase-admin";
import { DocumentReference } from "firebase-admin/firestore";
const myFunctions = require("../lib/index.js");

setupEnvironment();

jest.spyOn(admin, "initializeApp").mockImplementation();
const logSpy = jest.spyOn(console, "log");
const db = admin.firestore();

jest.mock("firebase-admin/functions", () => {
  return { getFunctions };
});

jest.mock("firebase-admin/extensions", () => {
  return { getExtensions };
});

const oneYearInTheFuture = new Date();
oneYearInTheFuture.setFullYear(oneYearInTheFuture.getFullYear() + 1);
const fixedTimestamp = admin.firestore.Timestamp.fromDate(oneYearInTheFuture);

const spyTimestamp = jest
  .spyOn(admin.firestore.Timestamp, "now")
  .mockImplementation(() => fixedTimestamp);

describe("firestore sync", () => {
  let document: DocumentReference;
  beforeEach(async () => {
    /** add an existing document from one year ago */
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() + 20);

    /** Add a document */
    document = await db
      .collection("latlong")
      .add({ lat: 1, long: 1, address: "test" })
      .then(async (doc) => doc);
  });

  test("syncs a new user to firestore", async () => {
    const updateLatLong = testEnv.wrap(myFunctions.updateLatLong);

    // expect(logSpy).toHaveBeenCalledWith("Enqueue payload:", {
    //   referencePath: "users/user1/posts",
    // });

    await updateLatLong({ address: "test", docId: document.id });
    expect(spyTimestamp).toHaveBeenCalled();
  });
});
