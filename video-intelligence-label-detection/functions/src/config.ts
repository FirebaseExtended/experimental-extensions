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

import * as videoIntelligence from "@google-cloud/video-intelligence";

const {
  LabelDetectionMode,
} = videoIntelligence.protos.google.cloud.videointelligence.v1;

export default {
  labelDetectionMode: parseDetectionMode(process.env.LABEL_DETECTION_MODE),
  videoConfidenceThreshold: parseFloat(process.env.VIDEO_CONFIDENCE_THRESHOLD!),
  frameConfidenceThreshold: parseFloat(process.env.FRAME_CONFIDENCE_THRESHOLD!),
  inputUri: process.env.INPUT_STORAGE_URI,
  outputUri: process.env.OUTPUT_STORAGE_URI,
  model: process.env.MODEL || null,
  stationaryCamera: process.env.STATIONARY_CAMERA === "true",
  locationId: process.env.LOCATION_ID,
};

function parseDetectionMode(value?: string): number {
  switch (value) {
    case "SHOT_MODE":
      return LabelDetectionMode.SHOT_MODE;

    case "FRAME_MODE":
      return LabelDetectionMode.FRAME_MODE;

    case "SHOT_AND_FRAME_MODE":
      return LabelDetectionMode.SHOT_AND_FRAME_MODE;

    default:
      return LabelDetectionMode.SHOT_MODE;
  }
}
