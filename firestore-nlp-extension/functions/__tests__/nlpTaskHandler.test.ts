/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NlpTaskHandler } from "../src/nlpTaskHandler";
import { Task } from "../src/models";
import { NlpTaskSuccessResult, NlpTaskErrorResult } from "../src/models";

// setup manual mock of language library
jest.mock("@google-cloud/language");
const { protos } = jest.requireActual("@google-cloud/language");

describe("NlpTaskHandler", () => {
  let languageMock;
  let mockAnalyzeSentimentMethod;
  let mockClassifyTextMethod;
  let mockAnalyzeEntitiesMethod;

  beforeAll(() => {
    languageMock = require("@google-cloud/language");
    mockAnalyzeSentimentMethod = languageMock.mockAnalyzeSentimentMethod;
    mockClassifyTextMethod = languageMock.mockClassifyTextMethod;
    mockAnalyzeEntitiesMethod = languageMock.mockAnalyzeEntitiesMethod;
  });

  beforeEach(() => {
    mockAnalyzeSentimentMethod.mockClear();
    mockClassifyTextMethod.mockClear();
    mockAnalyzeEntitiesMethod.mockClear();
  });

  describe("performSentimentAnalysis", () => {
    test(
      "correctly packages sentiment data on successful requests to " +
        "language API",
      async () => {
        mockAnalyzeSentimentMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              documentSentiment: {
                score: 0.8,
                magnitude: 0.9,
              },
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: [],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performSentimentAnalysis(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.SENTIMENT,
          output: { score: 0.8, magnitude: 0.9 },
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "correctly packages error response when an error occurs during " +
        "sentiment analysis",
      async () => {
        mockAnalyzeSentimentMethod.mockImplementationOnce(() =>
          Promise.reject(new Error("Some error"))
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: [],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performSentimentAnalysis(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskErrorResult = {
          taskName: Task.SENTIMENT,
          error: new Error("Some error"),
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );
  });

  describe("performTextClassification", () => {
    test(
      "correctly packages classification data on successful requests to " +
        "language API",
      async () => {
        mockClassifyTextMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              categories: [
                { name: "/Internet & Telecom/Mobile & Wireless" },
                { name: "/Jobs & Education" },
              ],
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: [],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performTextClassification(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.CLASSIFICATION,
          output: [
            "/Internet & Telecom/Mobile & Wireless",
            "/Jobs & Education",
          ],
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    // edge case, should not happen, but 'categories' field is optional
    test(
      "returns a success response with an empty array when the API " +
        "response has a missing 'categories' field",
      async () => {
        mockClassifyTextMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              /* no entities field */
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: [],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performTextClassification(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.CLASSIFICATION,
          output: [],
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "returns a success response with an empty array when the API " +
        "response has an empty 'categories' array",
      async () => {
        mockClassifyTextMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              categories: [],
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: [],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performTextClassification(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.CLASSIFICATION,
          output: [],
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "correctly packages error response when an error occurs during " +
        "text classification",
      async () => {
        mockClassifyTextMethod.mockImplementationOnce(() =>
          Promise.reject(new Error("Some error"))
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: [],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performTextClassification(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskErrorResult = {
          taskName: Task.CLASSIFICATION,
          error: new Error("Some error"),
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );
  });

  describe("performEntityExtraction", () => {
    test(
      "correctly packages entity data on successful requests to " +
        "language API",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              entities: [
                {
                  name: "Paris",
                  type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                  ],
                },
              ],
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: ["LOCATION"],
          saveCommonEntities: false,
        });
        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {
            LOCATION: ["Paris"],
          },
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "filters out entities of a type not found in the configured " +
        "entityTypesToSave",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              entities: [
                {
                  name: "Paris",
                  type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                  ],
                },
                {
                  name: "World cup",
                  type: protos.google.cloud.language.v1.Entity.Type.EVENT,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                  ],
                },
              ],
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: ["EVENT"], // does not include "LOCATION"
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {
            EVENT: ["World cup"],
          },
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "captures all relevant entities when many types are found in the " +
        "configured entityTypesToSave",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              entities: [
                {
                  name: "Paris",
                  type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                  ],
                },
                {
                  name: "World cup",
                  type: protos.google.cloud.language.v1.Entity.Type.EVENT,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                  ],
                },
              ],
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: ["LOCATION", "EVENT"],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {
            LOCATION: ["Paris"],
            EVENT: ["World cup"],
          },
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "filters out entities with only COMMON mentions if NlpTaskHandler is " +
        "configured to not save common entities",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              entities: [
                {
                  name: "Has proper and common mentions",
                  type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                  ],
                },
                {
                  name: "Has only common mentions",
                  type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .COMMON,
                    },
                  ],
                },
              ],
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: ["LOCATION"],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {
            LOCATION: ["Has proper and common mentions"],
          },
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "captures entities regardless of mention type if NlpTaskHandler is " +
        "configured to save common entities",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              entities: [
                {
                  name: "Has only proper mentions",
                  type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                  ],
                },
                {
                  name: "Has only common mentions",
                  type: "LOCATION",
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .COMMON,
                    },
                  ],
                },
              ],
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: ["LOCATION"],
          saveCommonEntities: true,
        });

        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {
            LOCATION: ["Has only proper mentions", "Has only common mentions"],
          },
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    // edge case, should not happen, but mentions field is optional
    test("filters out entities that don't include a 'mentions' field", async () => {
      mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
        Promise.resolve([
          {
            entities: [
              {
                name: "Has mentions",
                type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
                mentions: [
                  {
                    type: protos.google.cloud.language.v1.EntityMention.Type
                      .PROPER,
                  },
                ],
              },
              {
                name: "Does not have mentions",
                type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
              },
            ],
          },
        ])
      );
      const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
        entityTypesToSave: ["LOCATION"],
        saveCommonEntities: false,
      });

      const result = await nlpTaskHandler.performEntityExtraction(
        "Not used - response mocked"
      );

      const expectedResult: NlpTaskSuccessResult = {
        taskName: Task.ENTITY,
        output: {
          LOCATION: ["Has mentions"],
        },
      };
      expect(result).toStrictEqual(expectedResult);
    });

    test(
      "returns a success response with an empty output when the API " +
        "response has no identified entities",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.resolve([{ entities: [] }])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: ["LOCATION"],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {},
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "returns a success response with an empty output when no entities " +
        "with a type configured to be saved were returned by language API",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              entities: [
                {
                  name: "Paris",
                  type: protos.google.cloud.language.v1.Entity.Type.LOCATION,
                  mentions: [
                    {
                      type: protos.google.cloud.language.v1.EntityMention.Type
                        .PROPER,
                    },
                  ],
                },
              ],
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: ["EVENT"], // not confiugred to save LOCATION
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {},
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    // edge case, should not happen, but entities field is optional
    test(
      "returns a success response with an empty output when the API " +
        "response has a missing entities field",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.resolve([
            {
              /* no entities field */
            },
          ])
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: ["LOCATION"],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {},
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );

    test(
      "correctly packages error response when an error occurs during " +
        "entity extraction",
      async () => {
        mockAnalyzeEntitiesMethod.mockImplementationOnce(() =>
          Promise.reject(new Error("Some error"))
        );
        const nlpTaskHandler: NlpTaskHandler = new NlpTaskHandler({
          entityTypesToSave: [],
          saveCommonEntities: false,
        });

        const result = await nlpTaskHandler.performEntityExtraction(
          "Not used - response mocked"
        );

        const expectedResult: NlpTaskErrorResult = {
          taskName: Task.ENTITY,
          error: new Error("Some error"),
        };
        expect(result).toStrictEqual(expectedResult);
      }
    );
  });

  // testing a private method. Usually bad practice, but 'entityTypeToString'
  // deals with edge cases that warrant testing.
  describe("entityTypeToString", () => {
    let nlpTaskHandler: NlpTaskHandler;
    const entityTypeToStringName = "entityTypeToString";

    beforeEach(() => {
      nlpTaskHandler = new NlpTaskHandler({
        entityTypesToSave: [],
        saveCommonEntities: false,
      });
    });

    test(
      "returns the correct string representation of type is returned when " +
        "calling 'entityTypeToString' with enum value.",
      () => {
        const locationString: string = nlpTaskHandler[entityTypeToStringName](
          protos.google.cloud.language.v1.Entity.Type.LOCATION
        );

        expect(locationString).toBe("LOCATION");
      }
    );

    test(
      "returns the correct string representation of type is returned when calling " +
        "'entityTypeToString' with string equivalent of enum value.",
      () => {
        const locationString: string =
          nlpTaskHandler[entityTypeToStringName]("LOCATION");

        expect(locationString).toBe("LOCATION");
      }
    );

    test(
      "returns 'undefined' when calling 'entityTypeToString' with " +
        "'undefined' as input",
      () => {
        const undefinedString: string =
          nlpTaskHandler[entityTypeToStringName](undefined);

        expect(undefinedString).toBeUndefined();
      }
    );

    test(
      "returns 'undefined' when calling 'entityTypeToString' with a number " +
        "greater than the number of Type enum values",
      () => {
        // hack to "worst case scenario"
        const randomEnumString: string =
          nlpTaskHandler[entityTypeToStringName](999);

        expect(randomEnumString).toBeUndefined();
      }
    );
  });

  // testing a private method. Usually bad practice, but 'isProperMentionType'
  // deals with edge cases that warrant testing.
  describe("isProperMentionType", () => {
    let nlpTaskHandler: NlpTaskHandler;
    const isProperMentionTypeName = "isProperMentionType";

    beforeEach(() => {
      nlpTaskHandler = new NlpTaskHandler({
        entityTypesToSave: [],
        saveCommonEntities: false,
      });
    });

    test("returns 'true' when 'PROPER' enum value is given as parameter", () => {
      const isProper: boolean = nlpTaskHandler[isProperMentionTypeName](
        protos.google.cloud.language.v1.EntityMention.Type.PROPER
      );

      expect(isProper).toBeTruthy();
    });

    test("returns 'true' when 'PROPER' as a string is given as parameter", () => {
      const isProper: boolean =
        nlpTaskHandler[isProperMentionTypeName]("PROPER");

      expect(isProper).toBeTruthy();
    });

    test("returns 'false' when 'COMMON' enum value is given as parameter", () => {
      const isProper: boolean = nlpTaskHandler[isProperMentionTypeName](
        protos.google.cloud.language.v1.EntityMention.Type.COMMON
      );

      expect(isProper).toBeFalsy();
    });

    test("returns 'false' when 'COMMON' as a string is given as parameter", () => {
      const isProper: boolean =
        nlpTaskHandler[isProperMentionTypeName]("COMMON");

      expect(isProper).toBeFalsy();
    });

    test("returns 'false' when 'undefined' is is given as parameter", () => {
      const isProper: boolean =
        nlpTaskHandler[isProperMentionTypeName](undefined);

      expect(isProper).toBeFalsy();
    });
  });
});
