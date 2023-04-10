import * as functionsTest from "firebase-functions-test";
import * as functions from "firebase-functions";
import { Status } from "../src/types";
import { transcribeAudio } from "../src/index";
import {
  transcribeAndUpload,
  uploadTranscodedFile,
} from "../src/transcribe-audio";
import { EventContextOptions } from "firebase-functions-test/lib/v1";

// Initialize the firebase-functions-test library
const testEnv = functionsTest();

// Mock the required modules
jest.mock("firebase-admin", () => ({
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        download: jest.fn(() => Promise.resolve()),
      })),
    })),
  })),
  initializeApp: jest.fn(),
}));

jest.mock("@google-cloud/speech", () => ({
  SpeechClient: jest.fn(() => ({})),
}));

// Mock the other imported modules
jest.mock("../src/transcribe-audio", () => ({
  transcodeToLinear16: jest.fn(() => ({
    status: Status.SUCCESS,
    outputPath: "transcoded-file-path",
    sampleRateHertz: 16000,
    audioChannelCount: 1,
  })),
  transcribeAndUpload: jest.fn(() => ({
    status: Status.SUCCESS,
  })),
  uploadTranscodedFile: jest.fn(() => ({
    status: Status.SUCCESS,
    uploadResponse: [{}, {}],
  })),
}));

describe("transcribeAudio", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test cases
  test("should process the audio and transcribe it successfully", async () => {
    // Arrange: create a valid storage object and mock successful transcode and transcribe results
    const object: functions.storage.ObjectMetadata & EventContextOptions = {
      name: "test-file",
      bucket: "test-bucket",
      contentType: "audio/wav",
      kind: "",
      id: "",
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
    };

    // Act: call the transcribeAudio function with the valid object
    const fn = testEnv.wrap(transcribeAudio);
    await fn(object);

    // Assert: check if the proper functions are called and the processing is completed successfully
    expect(transcribeAndUpload).toHaveBeenCalledTimes(1);
    expect(uploadTranscodedFile).toHaveBeenCalledTimes(1);
  });

  test("should not process the audio if contentType is not set", async () => {
    // Arrange: create a fake storage object with no contentType
    const object: functions.storage.ObjectMetadata & EventContextOptions = {
      name: "test-file",
      bucket: "test-bucket",
      kind: "",
      id: "",
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
    };

    /** Run the function */
    await transcribeAudio(testEnv.wrap(transcribeAudio), object);

    /** Check results */
    expect(transcribeAndUpload).toHaveBeenCalledTimes(0);
    expect(uploadTranscodedFile).toHaveBeenCalledTimes(0);
  });

  test('should not process the audio if contentType is not "audio/"', async () => {
    // Arrange: create a fake storage object with an invalid contentType
    const object = {
      name: "test-file",
      bucket: "test-bucket",
      contentType: "text/plain",
    };

    /** Run the function */
    await transcribeAudio(testEnv.wrap(transcribeAudio), object);

    /** Check results */
    expect(transcribeAndUpload).toHaveBeenCalledTimes(0);
    expect(uploadTranscodedFile).toHaveBeenCalledTimes(0);
  });

  test("should not process the audio if object name is undefined", async () => {
    /** Setup the uploaded storage object  */
    const object = {
      bucket: "test-bucket",
      contentType: "audio/wav",
    };

    /** Run the function */
    await transcribeAudio(testEnv.wrap(transcribeAudio), object);

    /** Check results */
    expect(transcribeAndUpload).toHaveBeenCalledTimes(0);
    expect(uploadTranscodedFile).toHaveBeenCalledTimes(0);
  });

  test("should handle error when transcode fails", async () => {
    // Arrange: create a valid storage object and mock a failed transcode result
    const object: functions.storage.ObjectMetadata & EventContextOptions = {
      name: "test-file",
      bucket: "test-bucket",
      contentType: "audio/wav",
      kind: "",
      id: "",
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
    };

    // Mock the transcodeToLinear16 function to return a failed result
    const mockTranscodeToLinear16 =
      require("../src/transcribe-audio").transcodeToLinear16;
    mockTranscodeToLinear16.mockImplementation(() => ({
      status: Status.FAILURE,
    }));

    // Act: call the transcribeAudio function with the valid object
    const fn = testEnv.wrap(transcribeAudio);
    await fn(object);

    // Assert: check if the proper functions are called and the processing is halted due to the error
    expect(transcribeAndUpload).toHaveBeenCalledTimes(0);
    expect(uploadTranscodedFile).toHaveBeenCalledTimes(0);
  });

  test("should handle error when transcribe fails", async () => {
    // Arrange: create a valid storage object and mock a failed transcribe result
    const object: functions.storage.ObjectMetadata & EventContextOptions = {
      name: "test-file",
      bucket: "test-bucket",
      contentType: "audio/wav",
      kind: "",
      id: "",
      storageClass: "",
      size: "",
      timeCreated: "",
      updated: "",
    };

    // Mock the transcribeAndUpload function to return a failed result
    const mockTranscribeAndUpload =
      require("../src/transcribe-audio").transcribeAndUpload;
    mockTranscribeAndUpload.mockImplementation(() => ({
      status: Status.FAILURE,
    }));

    // Act: call the transcribeAudio function with the valid object
    const fn = testEnv.wrap(transcribeAudio);
    await fn(object);

    // Assert: check if the proper functions are called and the processing is halted due to the error
    expect(transcribeAndUpload).toHaveBeenCalledTimes(0);
    expect(uploadTranscodedFile).toHaveBeenCalledTimes(0); // The uploadTranscodedFile should not be called when transcribe fails
  });
});
