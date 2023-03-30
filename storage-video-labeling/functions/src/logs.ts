/*
 * Copyright 2019 Google LLC
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

import { logger } from "firebase-functions";
import { google } from "@google-cloud/video-intelligence/build/protos/protos";
import IAnnotateVideoRequest = google.cloud.videointelligence.v1.IAnnotateVideoRequest;

import config from "./config";

export const init = (): void => {
  logger.log("Initializing extension with configuration", config);
};

export const skip = (objectName?: string): void => {
  logger.log(
    `Skipping file due to unsupported file extension: ${
      objectName || "Unknown Object"
    }`
  );
};

export const queued = (objectName: string): void => {
  logger.log(
    `Video '${objectName}' has been successfully queued for label detection.`
  );
};

export const operationError = (objectName: string, error: Error): void => {
  logger.error(
    `Video '${objectName}' failed to be queued for label detection.`,
    error
  );
};

export const annotateVideo = (
  objectName: string,
  annotateConfig: IAnnotateVideoRequest
): void => {
  logger.log(
    `Creating annotate video request for ${objectName} with configuration`,
    annotateConfig
  );
};

export const skipPath = (objectName: string): void => {
  logger.log(
    `Skipping file '${objectName}' as it is not located in the configured input videos path '${config.inputVideosPath}'.`
  );
};
