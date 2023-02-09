/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFileSync } from "fs";
import { resolve as pathResolve } from "path";
import * as functionsTestInit from "firebase-functions-test";

import * as yaml from "js-yaml";
import mockedEnv from "mocked-env";

import { messages } from "../src/logs/messages";

let restoreEnv;
let extensionYaml;
let extensionParams;

// Mock up the environment config parameters.
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
