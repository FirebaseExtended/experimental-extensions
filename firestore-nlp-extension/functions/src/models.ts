/*
 * Copyright 2020 Google LLC
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

/**
 * Represents the schema for the saved information from sentiment analysis
 * requests.
 */
export interface SentimentAnalysisResult {
  score: number;
  magnitude: number;
}

/**
 * Represents the schema for the saved information from entity extracion
 * requests.
 */
export interface EntityExtractionResult {
  [key: string]: Array<string>;
}

/**
 * Represents the schema for the savec information from text
 * classification requests.
 */
export type TextClassificationResult = Array<string>;

/**
 * Represent possible output from the NLP tasks.
 */
export type NlpTaskOutput =
  | SentimentAnalysisResult
  | EntityExtractionResult
  | TextClassificationResult;

/**
 * Represents the output of the extension.
 */
export interface NlpData {
  [key: string]: NlpTaskOutput;
}

/**
 * Represents the successful result of a NLP task.
 */
export interface NlpTaskSuccessResult {
  taskName: string;
  output: NlpTaskOutput;
}

/**
 * Represents the error resultf of a NLP task.
 */
export interface NlpTaskErrorResult {
  taskName: string;
  error: Error;
}

/**
 * Wrapper type for success and error results of NLP tasks.
 */
export type NlpTaskResult = NlpTaskSuccessResult | NlpTaskErrorResult;

/**
 * Possibles NLP tasks performed by the system.
 */
export enum Task {
  SENTIMENT = "SENTIMENT",
  ENTITY = "ENTITY",
  CLASSIFICATION = "CLASSIFICATION",
}
