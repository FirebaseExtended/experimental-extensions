const mockAnnotateImage = jest.fn();

import * as admin from "firebase-admin";
import * as fft from "firebase-functions-test";
import { ObjectMetadata } from "firebase-functions/v1/storage";
import setupEnvironment from "./helpers/setupEnvironment";

const functions = require("../src/index");

setupEnvironment();
jest.spyOn(admin, "initializeApp").mockImplementation();
const db = admin.firestore();

/** Setup test environment */
const bucket = "demo-test.appspot.com";
const testEnv = fft({
  projectId: "demo-test",
  storageBucket: bucket,
});

/** Setup Mocks */
jest.mock("@google-cloud/vision", () => ({
  ImageAnnotatorClient: jest.fn(() => ({
    annotateImage: mockAnnotateImage,
  })),
}));

describe("extractText", () => {
  afterEach(() => {
    testEnv.cleanup();
    jest.clearAllMocks();
  });

  it("should process the image and save the extracted text", async () => {
    const document = db.collection("extractedTest").doc("test.png");
    const expectedText = "This is a test";

    mockAnnotateImage.mockResolvedValue([
      {
        textAnnotations: [
          {
            description: expectedText,
          },
        ],
      },
    ]);

    const obj: ObjectMetadata = {
      kind: "",
      id: "",
      bucket,
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
      name: "test.png",
      contentType: "image/png",
    };

    /** Upload test image */
    await admin
      .storage()
      .bucket(bucket)
      .upload(__dirname + "/fixtures/test.png");

    const wrapped = testEnv.wrap(functions.extractText);
    await wrapped(obj);

    /** Wait a second for the emulator to update */
    await new Promise((resolve) => setTimeout(resolve, 1000));

    /** Check if the document was updated */
    const result = await document.get();
    const { textAnnotations, file } = result.data();

    /** Test assertions */
    expect(file).toEqual("gs://demo-test.appspot.com/test.png");
    expect(textAnnotations[0].description).toEqual(expectedText);
  }, 12000);

  it("should not process if no object name provided", async () => {
    const document = db.collection("extractedTest").doc("notUpdated.png");
    const name = null;

    const obj: ObjectMetadata = {
      kind: "",
      id: "",
      bucket,
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
      name,
      contentType: "image/png",
    };

    const wrapped = testEnv.wrap(functions.extractText);
    await wrapped(obj);

    /**Check results */
    const result = await document.get();

    /** Test assertions */
    expect(result.exists).toBeFalsy();
  });

  it("should not process if no content type provided", async () => {
    const document = db.collection("extractedTest").doc("noContentType.png");

    const obj: ObjectMetadata = {
      kind: "",
      id: "",
      bucket,
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
      name: "test.png",
      contentType: "image/png",
    };

    const wrapped = testEnv.wrap(functions.extractText);
    await wrapped(obj);

    /**Check results */
    const result = await document.get();

    /** Test assertions */
    expect(result.exists).toBeFalsy();
  });

  it("should not process if the annotatiosn list is empty", async () => {
    const document = db.collection("extractedTest").doc("noAnnotations");

    const obj: ObjectMetadata = {
      kind: "",
      id: "",
      bucket,
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
      name: "test.png",
      contentType: "null",
    };

    /** Mock failed annotation */
    mockAnnotateImage.mockResolvedValue([[]]);

    const wrapped = testEnv.wrap(functions.extractText);
    await wrapped(obj);

    /**Check results */
    const result = await document.get();

    /** Test assertions */
    expect(result.exists).toBeFalsy();
  });

  it("should not process if no text annotations are returned", async () => {
    const document = db.collection("extractedTest").doc("noTextAnnotations");

    const obj: ObjectMetadata = {
      kind: "",
      id: "",
      bucket,
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
      name: "test.png",
      contentType: "null",
    };

    /** Mock failed annotation */
    mockAnnotateImage.mockResolvedValue([
      [
        {
          textAnnotations: [],
        },
      ],
    ]);

    const wrapped = testEnv.wrap(functions.extractText);
    await wrapped(obj);

    /**Check results */
    const result = await document.get();

    /** Test assertions */
    expect(result.exists).toBeFalsy();
  });
});
