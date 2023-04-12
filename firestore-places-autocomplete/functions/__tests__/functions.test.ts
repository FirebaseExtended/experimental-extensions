const functions = require("firebase-functions-test");
import * as admin from "firebase-admin";
import axios from "axios";

import { autocomplete } from "../src/index";
import config from "../src/config";

/** Mocks Apis */
jest.mock("axios");
const mAxios = axios as jest.MockedFunction<typeof axios>;

/** Setup functions and params */
const testEnv = functions({ projectId: "demo-test" });
const collectionId = config.collectionId;
const projectId = "demo-test";

/** Setup project emulator */
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
admin.initializeApp({ projectId });
const db = admin.firestore();

afterEach(() => {
  jest.clearAllMocks();
});

const { makeDocumentSnapshot, exampleDocumentSnapshot } = testEnv.firestore;

describe("Firestore Places Autocomplete Extension", () => {
  it("should update the document with predictions on valid input", async () => {
    /** Setup input data */
    const input = "New York";

    /** Create test documents */
    const doc = await db.collection(collectionId).add({});
    const docId = doc.id;
    const docReference = `${collectionId}/${docId}`;

    /** Mock Firestore document snapshots **/
    const beforeSnap = makeDocumentSnapshot({}, docReference);
    const afterSnap = makeDocumentSnapshot({ input }, docReference);
    const change = testEnv.makeChange(beforeSnap, afterSnap);

    /** Mock successful axios response */
    const mockResponse = {
      data: {
        predictions: [{ example: "one" }, { example: "two" }],
        status: "OK",
      },
      status: 200,
      statusText: "OK",
    };

    mAxios.mockResolvedValue(mockResponse);

    /** Run test */
    const wrapped = testEnv.wrap(autocomplete);
    await wrapped(change);

    /** Check results */
    const documentRef = admin.firestore().doc(`${collectionId}/${docId}`);
    const updatedDocument = await documentRef.get();

    /** Check results */
    expect(
      updatedDocument.get("ext_PlacesAutocomplete.predictions")
    ).toHaveLength(2);
  });

  it("should not update the document without an input value", async () => {
    /** Create test documents */
    const doc = await db.collection(collectionId).add({});
    const docId = doc.id;
    const docReference = `${collectionId}/${docId}`;

    /** Mock Firestore document snapshots **/
    const beforeSnap = makeDocumentSnapshot({}, docReference);
    const afterSnap = makeDocumentSnapshot({}, docReference);
    const change = testEnv.makeChange(beforeSnap, afterSnap);

    /** Run test */
    const wrapped = testEnv.wrap(autocomplete);
    await wrapped(change);

    /** Check results */
    const documentRef = admin.firestore().doc(`${collectionId}/${docId}`);
    const updatedDocument = await documentRef.get();

    expect(
      updatedDocument.get("ext_PlacesAutocomplete.predictions")
    ).toBeUndefined();
  });

  it("should not update the document without any after data", async () => {
    /** Create test documents */
    const doc = await db.collection(collectionId).add({});
    const docId = doc.id;

    /** Mock Firestore document snapshots **/
    const beforeSnap = exampleDocumentSnapshot;

    /** Run test */
    const wrapped = testEnv.wrap(autocomplete);
    await wrapped(beforeSnap);

    /** Check results */
    const documentRef = admin.firestore().doc(`${collectionId}/${docId}`);
    const updatedDocument = await documentRef.get();

    expect(
      updatedDocument.get("ext_PlacesAutocomplete.predictions")
    ).toBeUndefined();
  });

  it("should return early in the snapshot has not changed", async () => {
    /** Create test documents */
    const doc = await db.collection(collectionId).add({});
    const docId = doc.id;
    const docReference = `${collectionId}/${docId}`;

    /** Mock Firestore document snapshots **/
    const beforeSnap = makeDocumentSnapshot({ input: "test" }, docReference);
    const afterSnap = makeDocumentSnapshot({ input: "test" }, docReference);
    const change = testEnv.makeChange(beforeSnap, afterSnap);

    /** Run test */
    const wrapped = testEnv.wrap(autocomplete);
    await wrapped(change);

    /** Check results */
    expect(mAxios).not.toHaveBeenCalled();
  });

  it("should update the document with an error for a failed request", async () => {
    const input = "New York";

    /** Create test documents */
    const doc = await db.collection(collectionId).add({});
    const docId = doc.id;
    const docReference = `${collectionId}/${docId}`;

    /** Mock Firestore document snapshots **/
    const beforeSnap = makeDocumentSnapshot({}, docReference);
    const afterSnap = makeDocumentSnapshot({ input }, docReference);
    const change = testEnv.makeChange(beforeSnap, afterSnap);

    // Mock failed axios response
    const mockResponse = {
      data: {
        predictions: [{ example: "one" }, { example: "two" }],
        status: "Error Status",
        error_message: "Error Message",
      },
      status: 200,
      statusText: "Error",
    };
    mAxios.mockResolvedValue(mockResponse);

    /** Run test */
    const wrapped = testEnv.wrap(autocomplete);
    await wrapped(change);

    /** Check results */
    const documentRef = admin.firestore().doc(`${collectionId}/${docId}`);
    const updatedDocument = await documentRef.get();

    expect(updatedDocument.get("ext_PlacesAutocomplete.status")).toEqual(
      "Error Status"
    );
    expect(updatedDocument.get("ext_PlacesAutocomplete.error_message")).toEqual(
      "Error Message"
    );
  });
});
