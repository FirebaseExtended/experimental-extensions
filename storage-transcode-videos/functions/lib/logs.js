"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobFailed = exports.templateDoesNotExist = exports.transcodeVideo = exports.queued = exports.skipExtension = exports.skipPath = exports.init = void 0;
const firebase_functions_1 = require("firebase-functions");
const config_1 = require("./config");
const init = () => {
  firebase_functions_1.logger.log(
    "Initializing extension with configuration",
    config_1.default
  );
};
exports.init = init;
const skipPath = (objectName) => {
  firebase_functions_1.logger.log(
    `Skipping file '${objectName}' as it is not located in the configured input videos path '${config_1.default.inputVideosPath}'.`
  );
};
exports.skipPath = skipPath;
const skipExtension = (objectName) => {
  firebase_functions_1.logger.log(
    `Skipping file due to unsupported file extension: '${objectName}'.`
  );
};
exports.skipExtension = skipExtension;
const queued = (objectName, outputUri) => {
  firebase_functions_1.logger.log(
    `Video '${objectName}' has been successfully queued for transcoding. Output will appear at '${outputUri}'.`
  );
};
exports.queued = queued;
function transcodeVideo(objectName, jobRequest) {
  firebase_functions_1.logger.log(
    `Creating a transcode video request for '${objectName}' with configuration`,
    jobRequest
  );
}
exports.transcodeVideo = transcodeVideo;
function templateDoesNotExist(objectName, templateId) {
  firebase_functions_1.logger.error(
    `Error when processing storage object '${objectName}' - the specified template '${templateId}' does not exist.`
  );
}
exports.templateDoesNotExist = templateDoesNotExist;
const jobFailed = (objectName, failureReason, failureDetails) => {
  firebase_functions_1.logger.error(
    `Creating a transcode video request for '${objectName}' failed`,
    failureReason,
    failureDetails
  );
};
exports.jobFailed = jobFailed;
//# sourceMappingURL=logs.js.map
