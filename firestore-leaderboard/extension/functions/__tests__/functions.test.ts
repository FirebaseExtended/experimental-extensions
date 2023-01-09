import mockedEnv from "mocked-env";
import * as functionsTestInit from "firebase-functions-test";

import { messages } from "../src/logs/messages";

const defaultEnvironment = {
  PROJECT_ID: "fake-project",
  LOCATION: "us-central1",
  // values from extension.yaml param defaults
  SCORE_FIELD_NAME: "score",
  SCORE_COLLECTION_PATH: "users",
  USER_NAME_FIELD_NAME: "user_name",
  LEADERBOARD_COLLECTION_PATH: "leaderboards",
  LEADER_BOARD_NAME: "global_leaderboard",
  LEADER_BOARD_SIZE: "100",
};

const {
  snapshot,
  mockDocumentSnapshotFactory,
  mockFirestoreUpdate,
  mockFirestoreTransaction,
  mockUpdateLeaderboard,
  mockUpdateClassMethod,
  clearMocks,
} = global;

let functionsTest = functionsTestInit();
let restoreEnv;

describe("extension", () => {
  beforeEach(() => {
    restoreEnv = mockedEnv(defaultEnvironment);
    clearMocks();
  });

  test("functions are exported", () => {
    const exportedFunctions = jest.requireActual("../src");
    expect(exportedFunctions.onScoreUpdate).toBeInstanceOf(Function);
  });

  describe("functions.onScoreUpdate", () => {
    let logMock;
    let errorLogMock;
    let admin;
    let beforeSnapshot;
    let afterSnapshot;
    let documentChange;
    let leaderboardUpdate;

    beforeEach(() => {
      // this is best thought of as default environment for each test which might be altered within
      // each test subject to test's needs
      jest.resetModules();
      functionsTest = functionsTestInit();
      admin = require("firebase-admin");
      logMock = jest.fn();
      errorLogMock = jest.fn();
      beforeSnapshot = snapshot({});

      afterSnapshot = snapshot();
      leaderboardUpdate = mockUpdateLeaderboard();

      documentChange = functionsTest.makeChange(
        beforeSnapshot,
        mockDocumentSnapshotFactory(afterSnapshot)
      );
      admin.firestore().runTransaction = mockFirestoreTransaction();

      require("firebase-functions").logger = {
        log: logMock,
        error: errorLogMock,
      };
    });

    // Tests
    test("function exits early if scores are the same", async () => {
      leaderboardUpdate = mockUpdateLeaderboard();
      const callResult = await leaderboardUpdate(documentChange);
      expect(callResult).toBeUndefined();
    });

    test("function update leaderboard once scores are changed", async () => {
      //leaderboardUpdate = mockUpdateLeaderboard();
      beforeSnapshot = snapshot();

      afterSnapshot = snapshot({
        score: 200,
        user_name: "mock User2",
        changed: 123,
      });

      documentChange = functionsTest.makeChange(beforeSnapshot, afterSnapshot);
      const callResult = await mockUpdateClassMethod(documentChange);
      expect(callResult).toBeUndefined();
    });
  });
});
