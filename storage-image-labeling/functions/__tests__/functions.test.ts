const mockAnnotateImage = jest.fn();
const bucket = "demo-test.appspot.com";
const collectionPath = "imageLabels";

import * as admin from "firebase-admin";
import * as fft from "firebase-functions-test";
import { ObjectMetadata } from "firebase-functions/v1/storage";
import setupEnvironment from "./helpers/setupEnvironment";
import config from "../src/config";
import { clearFirestore } from "./helpers";

const functions = require("../src/index");

setupEnvironment();
jest.spyOn(admin, "initializeApp").mockImplementation();
const db = admin.firestore();

/** Setup test environment */

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

jest.mock("../src/config", () => ({
  default: {
    collectionPath,
    bucketName: "demo-test.appspot.com",
    includePathList: null,
    excludePathList: null,
  },
}));

describe("labelImage", () => {
  beforeEach(async () => {
    /** Clea rFirestore data */
    await clearFirestore();
  });

  beforeAll(async () => {
    /** Upload test image */
    await admin
      .storage()
      .bucket(bucket)
      .upload(__dirname + `/fixtures/test.png`);
  });

  afterEach(() => {
    testEnv.cleanup();
    jest.clearAllMocks();
  });

  it("should successfully label an image with no mode set", async () => {
    const document = db.collection("imageLabels").doc("test.png");
    const expectedText = "This is a test";

    mockAnnotateImage.mockResolvedValue([
      {
        labelAnnotations: [
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

    const wrapped = testEnv.wrap(functions.labelImage);
    await wrapped(obj);

    /** Wait a second for the emulator to update */
    await new Promise((resolve) => setTimeout(resolve, 1000));

    /** Check if the document was updated */
    const result = await document.get();
    //@ts-ignore
    const { labels, file } = result.data();

    /** Test assertions */
    expect(file).toEqual("gs://demo-test.appspot.com/test.png");
    expect(labels).toEqual([]);
  });

  it("should successfully label an image with no mode set as basic", async () => {
    const name = "test.png";
    const document = db.collection(collectionPath).doc(name);
    const expectedText = "This is a test";

    /** Setup config */
    config.mode = "basic";

    mockAnnotateImage.mockResolvedValue([
      {
        labelAnnotations: [
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
      name,
      contentType: "image/png",
    };

    const wrapped = testEnv.wrap(functions.labelImage);
    await wrapped(obj);

    /** Wait a second for the emulator to update */
    await new Promise((resolve) => setTimeout(resolve, 1000));

    /** Check if the document was updated */
    const result = await document.get();
    //@ts-ignore
    const { labels, file } = result.data();

    /** Test assertions */
    expect(file).toEqual(`gs://demo-test.appspot.com/${name}`);
    expect(labels[0]).toEqual("This is a test");
  });

  it("should successfully label an image with no mode set as full", async () => {
    const name = "test.png";
    const document = db.collection(collectionPath).doc(name);
    const expectedText = "This is a test";

    /** Setup config */
    config.mode = "full";

    mockAnnotateImage.mockResolvedValue([
      {
        labelAnnotations: [
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
      name,
      contentType: "image/png",
    };

    const wrapped = testEnv.wrap(functions.labelImage);
    await wrapped(obj);

    /** Wait a second for the emulator to update */
    await new Promise((resolve) => setTimeout(resolve, 1000));

    /** Check if the document was updated */
    const result = await document.get();
    //@ts-ignore
    const { labels, file } = result.data();

    /** Test assertions */
    expect(file).toEqual(`gs://demo-test.appspot.com/${name}`);
    expect(labels[0].description).toEqual("This is a test");
  });

  it("should not update on an annotation error", async () => {
    const name = "test.png";
    const document = db.collection(collectionPath).doc(name);

    /** Setup config */
    config.mode = "full";

    mockAnnotateImage.mockImplementation(() => {
      throw new Error("Error found");
    });

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

    const wrapped = testEnv.wrap(functions.labelImage);
    await wrapped(obj);

    /** Wait a second for the emulator to update */
    await new Promise((resolve) => setTimeout(resolve, 1000));

    /** Check if the document was updated */
    const result = await document.get();

    /** Test assertions */
    expect(result.data()).toBeUndefined();
  });
});
