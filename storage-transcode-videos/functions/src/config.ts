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

export default {
  defaultTemplateId: process.env.DEFAULT_TEMPLATE_ID!,
  inputVideosPath: process.env.INPUT_VIDEOS_PATH!,
  location: process.env.LOCATION!,
  outputUri: process.env.OUTPUT_STORAGE_URI,
  outputVideosBucket: process.env.OUTPUT_VIDEOS_BUCKET!,
  outputVideosPath: process.env.OUTPUT_VIDEOS_PATH!,
  projectId: process.env.PROJECT_ID!,
};
