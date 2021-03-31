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

import * as logs from "./logs";
import config from "./config";

// A curated list of supported file extensions based on:
// https://cloud.google.com/transcoder/docs/concepts/overview#supported_inputs_outputs
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

export function shouldProcessStorageObject(objectName?: string): boolean {
  if (!objectName) return false;

  // Is the file located in INPUT_VIDEOS_PATH.
  if (!`/${objectName}`.startsWith(config.inputVideosPath)) {
    logs.skipPath(objectName);
    return false;
  }

  // Is a valid extension that we can handle?
  for (const type of validMediaExtensions) {
    if (objectName.endsWith(type)) {
      return true;
    }
  }

  logs.skipExtension(objectName);
  return false;
}
