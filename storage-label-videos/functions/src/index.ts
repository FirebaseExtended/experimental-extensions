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
import * as path from "path";

const { logger } = require("firebase-functions");
const { Feature } = videoIntelligence.protos.google.cloud.videointelligence.v1;

// A curated list of supported file extensions based on https://cloud.google.com/video-intelligence/docs/supported-formats
const validMediaExtensions = [
  ".3g2",
  ".3gp",
  ".264",
  ".265",
  ".a64",
  ".apng",
  ".asf",
  ".avi",
  ".avs",
  ".avs2",
  ".cavs",
  ".f4v",
  ".flm",
  ".flv",
  ".gif",
  ".gxf",
  ".h261",
  ".h263",
  ".h264",
  ".h265",
  ".hevc",
  ".ismv",
  ".ivf",
  ".m1v",
  ".m2v",
  ".m4v",
  ".mjpeg",
  ".mjpg",
  ".mkv",
  ".mov",
  ".mp4",
  ".mpeg",
  ".mpeg4",
  ".mpg",
  ".ogv",
  ".rm",
  ".vc1",
  ".vc2",
  ".vob",
  ".webm",
  ".wmv",
  ".y4m",
];

function isValidFile(objectName?: string) {
  if (!objectName) return false;
  for (const type of validMediaTypes) {
    if (objectName.endsWith(type)) return true;
  }
  return false;
}

exports.analyse = functions.storage.object().onFinalize(async (object) => {
  if (!isValidFile(object.name)) return;

  const client = new videoIntelligence.VideoIntelligenceServiceClient();

  const annotateConfig = {
    inputUri: `gs://${object.bucket}/${object.name}`,
    outputUri: `gs://${config.outputUri}/${path.basename(
      object.name!,
      path.extname(object.name!)
    )}.json`,
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
  };

  logger.log(
    `Annotating video ${object.name} with configuration ${JSON.stringify(
      annotateConfig
    )}`
  );

  const [operation] = await client.annotateVideo(annotateConfig);

  if (operation.error) {
    logger.error(`Found error ${operation.error}`);
    return;
  }

  logger.log(
    `Video '${object.name}' has been successfully queued for label detection.`
  );
});
