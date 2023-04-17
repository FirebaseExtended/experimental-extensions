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

import * as path from "path";
import * as functions from "firebase-functions";
import { VideoIntelligenceServiceClient } from "@google-cloud/video-intelligence";

import { google } from "@google-cloud/video-intelligence/build/protos/protos";
import IAnnotateVideoRequest = google.cloud.videointelligence.v1.IAnnotateVideoRequest;
import Feature = google.cloud.videointelligence.v1.Feature;

import config from "./config";
import * as logs from "./logs";
import { shouldProcessStorageObject } from "./utils";

const videoIntelligenceServiceClient = new VideoIntelligenceServiceClient();

logs.init();

export const labelVideo = functions.storage
  .bucket(config.inputVideosBucket)
  .object()
  .onFinalize(async (object) => {
    if (!object.name) return;

    console.log("test 1 >>>>", config);

    if (!shouldProcessStorageObject(object.name)) return;

    // Output to a folder named the same as the original file, minus the file extension.
    const outputUri = `gs://${config.outputBucket}${
      config.outputPath
    }${path.basename(object.name)}.json`;

    const annotateConfig: IAnnotateVideoRequest = {
      inputUri: `gs://${object.bucket}/${object.name}`,
      outputUri,
      locationId: config.locationId,
      features: [Feature.LABEL_DETECTION],
      videoContext: {
        labelDetectionConfig: {
          frameConfidenceThreshold: config.frameConfidenceThreshold,
          labelDetectionMode: config.labelDetectionMode,
          model: config.model,
          stationaryCamera: config.stationaryCamera,
          videoConfidenceThreshold: config.videoConfidenceThreshold,
        },
      },
    };

    logs.annotateVideo(object.name!, annotateConfig);

    const [operation] = await videoIntelligenceServiceClient.annotateVideo(
      annotateConfig
    );

    if (operation.error) {
      logs.operationError(object.name!, operation.error);
      return;
    }

    logs.queued(object.name!);
  });
