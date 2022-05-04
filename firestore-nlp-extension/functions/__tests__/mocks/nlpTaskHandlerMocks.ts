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

import { Task } from "../../src/models";

/**
 * Mock implementation of the performSentimentAnalysis method, with a default
 * mock implementation that returns a success result.
 */
export const mockPerformSentimentAnalysis = jest
  .fn()
  .mockImplementation((input: string) => {
    return Promise.resolve({
      taskName: Task.SENTIMENT,
      output: {
        score: 0.75,
        magnitude: 0.9,
      },
    });
  });

/**
 * Mock implementation of the performTextClassification method, with a default
 * mock implementation that returns a success result.
 */
export const mockPerformTextClassification = jest
  .fn()
  .mockImplementation((input: string) => {
    return Promise.resolve({
      taskName: Task.CLASSIFICATION,
      output: ["/Internet & Telecom/Mobile & Wireless"],
    });
  });

/**
 * Mock implementation of the performEntityExtraction method, with a default
 * mock implementation that returns a success result.
 */
export const mockPerformEntityExtraction = jest
  .fn()
  .mockImplementation((input: string) => {
    return Promise.resolve({
      taskName: Task.ENTITY,
      output: {
        LOCATION: ["Paris"],
        EVENT: ["World cup"],
      },
    });
  });

/**
 * Mock implementation of the NlpTaskHandler class.
 */
export const NlpTaskHandlerMock = jest.fn().mockImplementation(() => {
  return {
    performSentimentAnalysis: mockPerformSentimentAnalysis,
    performTextClassification: mockPerformTextClassification,
    performEntityExtraction: mockPerformEntityExtraction,
  };
});
