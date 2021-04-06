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
const path = require("path");
const functions = require("firebase-functions");
const videoIntelligence = require("@google-cloud/video-intelligence");
const protos_1 = require("@google-cloud/video-intelligence/build/protos/protos");
var Feature = protos_1.google.cloud.videointelligence.v1.Feature;
const config_1 = require("./config");
const logs = require("./logs");
const utils_1 = require("./utils");
const videoIntelligenceServiceClient = new videoIntelligence.VideoIntelligenceServiceClient();
logs.init();
exports.labelVideo = functions.storage.object().onFinalize(async (object) => {
    if (!object.name)
        return;
    if (!utils_1.shouldProcessStorageObject(object.name))
        return;
    // Output to a folder named the same as the original file, minus the file extension.
    const outputUri = `gs://${config_1.default.outputVideosBucket}${config_1.default.outputVideosPath}${path.basename(object.name)}.json`;
    const annotateConfig = {
        inputUri: `gs://${object.bucket}/${object.name}`,
        outputUri,
        locationId: config_1.default.locationId,
        features: [Feature.LABEL_DETECTION],
        videoContext: {
            labelDetectionConfig: {
                frameConfidenceThreshold: config_1.default.frameConfidenceThreshold,
                labelDetectionMode: config_1.default.labelDetectionMode,
                model: config_1.default.model,
                stationaryCamera: config_1.default.stationaryCamera,
                videoConfidenceThreshold: config_1.default.videoConfidenceThreshold,
            },
        },
    };
    logs.annotateVideo(object.name, annotateConfig);
    const [operation] = await videoIntelligenceServiceClient.annotateVideo(annotateConfig);
    if (operation.error) {
        logs.operationError(object.name, operation.error);
        return;
    }
    logs.queued(object.name);
});
//# sourceMappingURL=index.js.map