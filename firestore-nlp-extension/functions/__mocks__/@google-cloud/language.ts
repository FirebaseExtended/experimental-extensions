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

"use strict";

const language = jest.genMockFromModule("@google-cloud/language");
import { protos } from "@google-cloud/language";

/**
 * Mock implementation of the analyzeSentiment method, with a default
 * mock implementation.
 */
const mockAnalyzeSentimentMethod = jest
  .fn()
  .mockImplementation(
    (req: protos.google.cloud.language.v1.AnalyzeSentimentRequest) => {
      return Promise.resolve([
        {
          documentSentiment: {
            score: 999,
            magnitude: 999,
          },
        },
      ]);
    }
  );

/**
 * Mock implementation of the classifyText method, with a default
 * mock implementation.
 */
const mockClassifyTextMethod = jest
  .fn()
  .mockImplementation(
    (req: protos.google.cloud.language.v1.ClassifyTextRequest) => {
      return Promise.resolve([
        {
          categories: [{ name: "/Internet & Telecom/Mobile & Wireless" }],
        },
      ]);
    }
  );

/**
 * Mock implementation of the analyzeEntities method, with a default
 * mock implementation.
 */
const mockAnalyzeEntitiesMethod = jest
  .fn()
  .mockImplementation(
    (req: protos.google.cloud.language.v1.AnalyzeEntitiesRequest) => {
      return Promise.resolve([
        {
          entities: [
            {
              name: "Paris",
              type: "LOCATION", // can't use actualy Entity.Type.LOCATION from protos, breaks mock
              mentions: [
                {
                  type: "PROPER", // can't use actual EntityMention.Type.PROPER from protos, breaks mock
                },
              ],
            },
          ],
        },
      ]);
    }
  );

/**
 * Mock implementation of the LanguageServiceClient class.
 */
const LanguageServiceClient = jest.fn().mockImplementation(() => {
  return {
    analyzeSentiment: mockAnalyzeSentimentMethod,
    classifyText: mockClassifyTextMethod,
    analyzeEntities: mockAnalyzeEntitiesMethod,
  };
});

(language as any).LanguageServiceClient = LanguageServiceClient;
(language as any).mockAnalyzeSentimentMethod = mockAnalyzeSentimentMethod;
(language as any).mockClassifyTextMethod = mockClassifyTextMethod;
(language as any).mockAnalyzeEntitiesMethod = mockAnalyzeEntitiesMethod;

module.exports = language;
