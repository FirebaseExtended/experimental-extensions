import { readFileSync } from "fs";
import { resolve as pathResolve } from "path";
import * as functionsTestInit from "firebase-functions-test";

import * as yaml from "js-yaml";
import mockedEnv from "mocked-env";

import { messages } from "../src/logs/messages";

let restoreEnv;
let extensionYaml;
let extensionParams;

const environment = {
  LOCATION: "us-central1",
  SCORE_FIELD_NAME: "score",
  SCORE_COLLECTION_PATH: "users",
  USER_NAME_FIELD_NAME: "user_name",
  LEADERBOARD_COLLECTION_PATH: "leaderboards",
  LEADER_BOARD_NAME: "global_leaderboard",
  LEADER_BOARD_SIZE: "100",
};

const { config } = global;

functionsTestInit();

describe("extension config", () => {
  let logMock;

  beforeAll(() => {
    extensionYaml = yaml.safeLoad(
      readFileSync(pathResolve(__dirname, "../../extension.yaml"), "utf8")
    );

    extensionParams = extensionYaml.params.reduce((obj, param) => {
      obj[param.param] = param;
      return obj;
    }, {});
  });

  beforeEach(() => {
    restoreEnv = mockedEnv(environment);
    logMock = jest.fn();

    require("firebase-functions").logger = {
      log: logMock,
    };
  });

  afterEach(() => restoreEnv());

  test("config loaded from environment variables", () => {
    const functionsConfig = config();

    expect(functionsConfig).toMatchSnapshot({});
  });

  test("config is logged on initialize", () => {
    jest.requireActual("../src");

    const functionsConfig = config();

    expect(logMock).toBeCalledWith(...messages.init(functionsConfig));
  });
});
