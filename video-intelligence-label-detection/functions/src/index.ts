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

import * as functions from "firebase-functions";
import * as videoIntelligence from "@google-cloud/video-intelligence";
import config from "./config";

const { Feature } = videoIntelligence.protos.google.cloud.videointelligence.v1;

const admin = require("firebase-admin");
admin.initializeApp();

const validMediaTypes = [".mp4"];

exports.analyse = functions.storage.object().onFinalize(async object => {
  if (!validMediaTypes.includes(object.name?.toLowerCase() || "")) return;

  const client = new videoIntelligence.VideoIntelligenceServiceClient();

  const [operation] = await client.annotateVideo({
    inputUri: config.inputUri,
    outputUri: config.outputUri,
    locationId: config.locationId,
    features: [Feature.LABEL_DETECTION],
    videoContext: {
      labelDetectionConfig: {
        labelDetectionMode: config.labelDetectionMode,
        videoConfidenceThreshold: config.videoConfidenceThreshold,
        frameConfidenceThreshold: config.frameConfidenceThreshold,
        model: config.model,
        stationaryCamera: config.stationaryCamera,
      },
    },
  });

  if (operation.error) {
    // log error
    return;
  }

  //TODO: Add logger to confirm annotation, include input uri / output uri
});
