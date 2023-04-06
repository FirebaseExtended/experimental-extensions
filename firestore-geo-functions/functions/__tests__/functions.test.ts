const fft = require("firebase-functions-test");
const testEnv = fft({ projectId: "demo-test" });
import setupEnvironment from "./helpers/setupEnvironment";
import { getFunctions, getExtensions } from "./__mocks__/functions";

import * as admin from "firebase-admin";
import { getFutureTimestamp, waitForDocumentUpdate } from "./helpers";
const myFunctions = require("../lib/index.js");

setupEnvironment();

jest.spyOn(admin, "initializeApp").mockImplementation();
const logSpy = jest.spyOn(console, "log");
const errorSpy = jest.spyOn(console, "error");
const db = admin.firestore();

jest.mock("firebase-admin/functions", () => {
  return { getFunctions };
});

jest.mock("firebase-admin/extensions", () => {
  return { getExtensions };
});

/** Set global test data */
const address = "1600 Amphitheatre Parkway, Mountain View, CA";

describe("firestore sync functions", () => {
  describe("updateLatLong()", () => {
    test("successfully updates a latlong for a valid address", async () => {
      /** Create a temporary document for unit testing to update */
      const document = db.collection("latlong").doc("updateTest");
      await document.set({ address }).then((doc) => doc);

      const updateLatLong = testEnv.wrap(myFunctions.updateLatLong);

      const spyTimestamp = jest
        .spyOn(admin.firestore.Timestamp, "now")
        .mockImplementationOnce(() => getFutureTimestamp());

      await updateLatLong({ address, docId: document.id });
      expect(spyTimestamp).toHaveBeenCalled();

      /** Aseert document has updated */
      await waitForDocumentUpdate(document, "latitude", 37.4223878);

      /** Assert document has updated */
      const doc = await document.get();

      const { ext_getLatLongStatus, latitude, longitude } = doc.data();
      expect(ext_getLatLongStatus).toEqual({ status: "OK" });
      expect(latitude).toEqual(37.4223878);
      expect(longitude).toEqual(-122.0841877);
    });

    test("successfully creates a latlong for a valid address", async () => {
      /** Create a temporary document for unit testing to update */
      const createDocument = db.collection("latlong").doc("createTest");
      await createDocument.set({}).then((doc) => doc);

      // Make snapshot for state of database beforehand
      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        {},
        "latlong/createTest"
      );
      // Make snapshot for state of database after the change
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(
        { address },
        "latlong/createTest"
      );
      const change = testEnv.makeChange(beforeSnap, afterSnap);

      const writeLatLong = testEnv.wrap(myFunctions.writeLatLong);
      await writeLatLong(change);

      const doc = await createDocument.get();
      const { ext_getLatLongStatus, latitude, longitude } = doc.data();
      expect(ext_getLatLongStatus).toEqual({ status: "OK" });
      expect(latitude).toEqual(37.4223878);
      expect(longitude).toEqual(-122.0841877);
    });

    test("does not update a deleted document", async () => {
      /** Create a temporary document for unit testing to update */
      const deleteDocument = db
        .collection("latlong")
        .doc("deletedDocumentTest");
      await deleteDocument.set({}).then((doc) => doc);

      /** Delete the document */
      await deleteDocument.delete();

      // Make snapshot for state of database beforehand
      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        { address },
        "latlong/deletedDocumentTest"
      );

      // Make snapshot for state of database after the change
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(
        null,
        "latlong/deletedDocumentTest"
      );
      const change = testEnv.makeChange(beforeSnap, afterSnap);

      const writeLatLong = testEnv.wrap(myFunctions.writeLatLong);
      await writeLatLong(change);

      const doc = await deleteDocument.get();
      expect(doc.exists).toBeFalsy();
    });

    test("does not update if an address is not provided", async () => {
      /** Create a temporary document for unit testing to update */
      const createDocument = db
        .collection("latlong")
        .doc("addressNotProvidedTest");
      await createDocument.set({}).then((doc) => doc);

      // Make snapshot for state of database beforehand
      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        { address },
        "latlong/addressNotProvidedTest"
      );
      // Make snapshot for state of database after the change
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(
        {},
        "latlong/addressNotProvidedTest"
      );
      const change = testEnv.makeChange(beforeSnap, afterSnap);

      const writeLatLong = testEnv.wrap(myFunctions.writeLatLong);
      await writeLatLong(change);

      const doc = await createDocument.get();
      const { ext_getLatLongStatus, latitude, longitude } = doc.data();
      expect(ext_getLatLongStatus).toBeUndefined();
      expect(latitude).toBeUndefined();
      expect(longitude).toBeUndefined();
    });

    test("does not update if an address is not a valid string", async () => {
      /** Create a temporary document for unit testing to update */
      const createDocument = db
        .collection("latlong")
        .doc("addressIsANumberTest");

      await createDocument.set({ address: 123 }).then((doc) => doc);

      // Make snapshot for state of database beforehand
      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        {},
        "latlong/addressNotProvidedTest"
      );
      // Make snapshot for state of database after the change
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(
        { address: 123 },
        "latlong/addressNotProvidedTest"
      );
      const change = testEnv.makeChange(beforeSnap, afterSnap);

      const writeLatLong = testEnv.wrap(myFunctions.writeLatLong);
      await writeLatLong(change);

      const doc = await createDocument.get();
      const {
        ext_getLatLongStatus,
        latitude,
        longitude,
        address: currentAddress,
      } = doc.data();
      expect(ext_getLatLongStatus).toBeUndefined();
      expect(currentAddress).toEqual(123);
      expect(latitude).toBeUndefined();
      expect(longitude).toBeUndefined();
    });
  });

  describe("writeBestDrivingTime()", () => {
    const origin = "1600 Amphitheatre Parkway, Mountain View, CA";
    const destination = "85 10th Ave, New York, NY";

    test("should trigger on document creation and update best driving time", async () => {
      /** Create a temporary document for unit testing to update */
      const createDocument = db
        .collection("bestDrivingTime")
        .doc("createBestDrivingTimeTest");
      await createDocument.set({}).then((doc) => doc);

      // Make snapshot for state of database beforehand
      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        {},
        "bestDrivingTime/createBestDrivingTimeTest"
      );
      // Make snapshot for state of database after the change
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(
        { origin, destination },
        "bestDrivingTime/createBestDrivingTimeTest"
      );
      const change = testEnv.makeChange(beforeSnap, afterSnap);

      const writeBestDrivingTime = testEnv.wrap(
        myFunctions.writeBestDrivingTime
      );
      await writeBestDrivingTime(change);

      /** Aseert document has updated */
      await waitForDocumentUpdate(
        createDocument,
        "bestDrivingTime",
        [156483, 156484]
      );

      /** Assert document has updated */
      const doc = await createDocument.get();
      const { ext_getBestDriveTimeStatus, bestDrivingTime } = doc.data();
      expect(ext_getBestDriveTimeStatus).toEqual({ status: "OK" });

      /** Value can differentiate, expect with the follwoign expectations */
      expect(bestDrivingTime).toBeGreaterThan(156482);
      expect(bestDrivingTime).toBeLessThan(156486);
    });

    test("should trigger on document update and update best driving time", async () => {
      /** Create a temporary document for unit testing to update */
      const createDocument = db
        .collection("bestDrivingTime")
        .doc("updateBestDrivingTimeTest");
      await createDocument
        .set({
          bestDrivingTime: 0,
        })
        .then((doc) => doc);

      // Make snapshot for state of database beforehand
      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        { bestDrivingTime: 0 },
        "bestDrivingTime/updateBestDrivingTimeTest"
      );
      // Make snapshot for state of database after the change
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(
        { origin, destination },
        "bestDrivingTime/updateBestDrivingTimeTest"
      );
      const change = testEnv.makeChange(beforeSnap, afterSnap);
      const writeBestDrivingTime = testEnv.wrap(
        myFunctions.writeBestDrivingTime
      );

      await writeBestDrivingTime(change);

      // /** Aseert document has updated */
      await waitForDocumentUpdate(
        createDocument,
        "bestDrivingTime",
        [156483, 156484]
      );

      /** Assert document has updated */
      const doc = await createDocument.get();
      const { ext_getBestDriveTimeStatus, bestDrivingTime } = doc.data();
      expect(ext_getBestDriveTimeStatus).toEqual({ status: "OK" });

      /** Value can differentiate, expect with the follwoign expectations */
      expect(bestDrivingTime).toBeGreaterThan(156482);
      expect(bestDrivingTime).toBeLessThan(156486);
    });
  });
});
