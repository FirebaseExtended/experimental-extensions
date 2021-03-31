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
const functions = require("firebase-functions");
const videoIntelligence = require("@google-cloud/video-intelligence");
const config_1 = require("./config");
const path = require("path");
const { logger } = require("firebase-functions");
const { Feature } = videoIntelligence.protos.google.cloud.videointelligence.v1;
const validMediaTypes = [".mp4"];
function isValidFile(objectName) {
    if (!objectName)
        return false;
    for (const type of validMediaTypes) {
        if (objectName.endsWith(type))
            return true;
    }
    return false;
}
exports.analyse = functions.storage.object().onFinalize(async (object) => {
    if (!isValidFile(object.name))
        return;
    const client = new videoIntelligence.VideoIntelligenceServiceClient();
    const annotateConfig = {
        inputUri: `gs://${object.bucket}/${object.name}`,
        outputUri: `gs://${config_1.default.outputUri}/${path.basename(object.name, path.extname(object.name))}.json`,
        locationId: config_1.default.locationId,
        features: [Feature.LABEL_DETECTION],
        videoContext: {
            labelDetectionConfig: {
                labelDetectionMode: config_1.default.labelDetectionMode,
                videoConfidenceThreshold: config_1.default.videoConfidenceThreshold,
                frameConfidenceThreshold: config_1.default.frameConfidenceThreshold,
                model: config_1.default.model,
                stationaryCamera: config_1.default.stationaryCamera,
            },
        },
    };
    logger.log(`Annotating video ${object.name} with configuration ${JSON.stringify(annotateConfig)}`);
    const [operation] = await client.annotateVideo(annotateConfig);
    if (operation.error) {
        logger.error(`Found error ${operation.error}`);
        return;
    }
    logger.log(`Video '${object.name}' has been successfully queued for label detection.`);
});
//# sourceMappingURL=index.js.map