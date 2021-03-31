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
import { google } from "@google-cloud/video-transcoder/build/protos/protos";

import config from "./config";
import IFailureDetail = google.cloud.video.transcoder.v1beta1.IFailureDetail;
import ICreateJobRequest = google.cloud.video.transcoder.v1beta1.ICreateJobRequest;

export const init = (): void => {
  logger.log("Initializing extension with configuration", config);
};

export const skipPath = (objectName: string): void => {
  logger.log(
    `Skipping file '${objectName}' as it is not located in the configured input videos path '${config.inputVideosPath}'.`
  );
};

export const skipExtension = (objectName?: string): void => {
  logger.log(
    `Skipping file due to unsupported file extension: '${objectName}'.`
  );
};

export const queued = (objectName: string, outputUri: string): void => {
  logger.log(
    `Video '${objectName}' has been successfully queued for transcoding. Output will appear at '${outputUri}'.`
  );
};

export function transcodeVideo(
  objectName: string,
  jobRequest: ICreateJobRequest
) {
  logger.log(
    `Creating a transcode video request for '${objectName}' with configuration`,
    jobRequest
  );
}

export function templateDoesNotExist(objectName: string, templateId: string) {
  logger.error(
    `Error when processing storage object '${objectName}' - the specified template '${templateId}' does not exist.`
  );
}

export const jobFailed = (
  objectName: string,
  failureReason?: String | null,
  failureDetails?: IFailureDetail[] | null
): void => {
  logger.error(
    `Creating a transcode video request for '${objectName}' failed`,
    failureReason,
    failureDetails
  );
};
