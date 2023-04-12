/** Hoist Speech mock files */
const synthesizeSpeechMock = jest.fn();
import { mockedConfig } from "./__mocks__";

import * as admin from "firebase-admin";
import * as functions from "firebase-functions-test";

import { textToSpeech } from "../src/index";
import config from "../src/config";
import setupEnvironment from "./helpers/setupEnvironment";

/** Add mocks */
jest.mock("../src/config", () => {
  return { ...mockedConfig };
});

jest.mock("@google-cloud/text-to-speech", () => {
  return {
    TextToSpeechClient: jest.fn(() => ({
      synthesizeSpeech: synthesizeSpeechMock,
    })),
  };
});

/** Setu[ project config */
const projectId = "demo-test";
const testEnv = functions({ projectId });
setupEnvironment();
const db = admin.firestore();

/** Global vars */
const collectionPath = config.collectionPath;
const { makeDocumentSnapshot } = testEnv.firestore;

afterEach(() => {
  jest.clearAllMocks();
});

describe("Firestore Text to Speech Extension", () => {
  it("should process the text to speech on valid input", async () => {
    /** Set document data */
    const text = "Hello World";
    const doc = await db.collection(collectionPath).add({});
    const path = `${collectionPath}/${doc.id}`;
    const snap = makeDocumentSnapshot({ text }, path);

    /** Mock a successful api response */
    const mockResponse = [
      {
        audioContent: Buffer.from("mock-audio-content"),
      },
    ];

    synthesizeSpeechMock.mockImplementation(() => mockResponse);

    /** Run the function */
    const wrapped = testEnv.wrap(textToSpeech);
    await wrapped(snap);

    /** Check results */
    expect(synthesizeSpeechMock).toHaveBeenCalled();
  });

  it("should not process the text to speech without a text value", async () => {
    /** Set document data */
    const notText = "Hello World";
    const doc = await db.collection(collectionPath).add({});
    const path = `${collectionPath}/${doc.id}`;
    const snap = makeDocumentSnapshot({ notText }, path);

    /** Run the function */
    const wrapped = testEnv.wrap(textToSpeech);
    await wrapped(snap);

    /** Check results */
    expect(synthesizeSpeechMock).not.toHaveBeenCalled();
  });

  it("should throw an error if text-to-speech request fails", async () => {
    /** Set document data */
    const input = "Hello World";
    const doc = await db.collection(collectionPath).add({ text: input });
    const snap = makeDocumentSnapshot(
      { text: input },
      `${collectionPath}/${doc.id}`
    );

    /** Mock a unsuccessful api response */
    synthesizeSpeechMock.mockRejectedValue(new Error("Mock error"));

    /** Run the function */
    const wrapped = testEnv.wrap(textToSpeech);

    /** Check results */
    await expect(wrapped(snap)).rejects.toThrow("Mock error");
    expect(synthesizeSpeechMock).toHaveBeenCalled();
  });
});
