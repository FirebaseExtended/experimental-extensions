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
exports.skipPath = exports.annotateVideo = exports.operationError = exports.queued = exports.skip = exports.init = void 0;
const firebase_functions_1 = require("firebase-functions");
const config_1 = require("./config");
const init = () => {
    firebase_functions_1.logger.log("Initializing extension with configuration", config_1.default);
};
exports.init = init;
const skip = (objectName) => {
    firebase_functions_1.logger.log(`Skipping file due to unsupported file extension: ${objectName || "Unknown Object"}`);
};
exports.skip = skip;
const queued = (objectName) => {
    firebase_functions_1.logger.log(`Video '${objectName}' has been successfully queued for label detection.`);
};
exports.queued = queued;
const operationError = (objectName, error) => {
    firebase_functions_1.logger.error(`Video '${objectName}' failed to be queued for label detection.`, error);
};
exports.operationError = operationError;
const annotateVideo = (objectName, annotateConfig) => {
    firebase_functions_1.logger.log(`Creating annotate video request for ${objectName} with configuration`, annotateConfig);
};
exports.annotateVideo = annotateVideo;
const skipPath = (objectName) => {
    firebase_functions_1.logger.log(`Skipping file '${objectName}' as it is not located in the configured input videos path '${config_1.default.inputVideosPath}'.`);
};
exports.skipPath = skipPath;
//# sourceMappingURL=logs.js.map