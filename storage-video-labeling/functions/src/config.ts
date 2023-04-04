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

import { parseDetectionMode } from "./utils";

export default {
  locationId: process.env.LOCATION,
  inputVideosBucket: process.env.INPUT_VIDEOS_BUCKET,
  inputVideosPath: process.env.INPUT_VIDEOS_PATH!,
  outputUri: process.env.OUTPUT_STORAGE_URI,
  outputBucket: process.env.OUTPUT_BUCKET!,
  outputPath: process.env.OUTPUT_PATH!,
  labelDetectionMode: parseDetectionMode(process.env.LABEL_DETECTION_MODE),
  videoConfidenceThreshold: parseFloat(process.env.VIDEO_CONFIDENCE_THRESHOLD!),
  frameConfidenceThreshold: parseFloat(process.env.FRAME_CONFIDENCE_THRESHOLD!),
  model: process.env.MODEL || null,
  stationaryCamera:
    process.env.STATIONARY_CAMERA === "true" &&
    process.env.LABEL_DETECTION_MODE !== "SHOT_AND_FRAME_MODE",
};
