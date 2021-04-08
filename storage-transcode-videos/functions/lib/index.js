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
const videoTranscoder = require("@google-cloud/video-transcoder");
const config_1 = require("./config");
const logs = require("./logs");
const utils_1 = require("./utils");
const videoTranscoderServiceClient = new videoTranscoder.TranscoderServiceClient();
logs.init();
exports.transcodevideo = functions.storage
  .object()
  .onFinalize(async (object) => {
    var _a;
    if (!object.name) return;
    if (!utils_1.shouldProcessStorageObject(object.name)) return;
    // `videoTranscoderTemplateId` can be specified on the storage objects metadata to override
    // the template that is used to transcode the incoming video. Defaults to `DEFAULT_TEMPLATE_ID`
    // from the Firebase Extension parameters.
    const templateId =
      ((_a = object.metadata) === null || _a === void 0
        ? void 0
        : _a.videoTranscoderTemplateId) || config_1.default.defaultTemplateId;
    // Output to a folder named the same as the original file, minus the file extension.
    const outputUri = `gs://${config_1.default.outputVideosBucket}${
      config_1.default.outputVideosPath
    }${path.basename(object.name)}/`;
    // Ensure the template exists if not using the known web-hd preset.
    if (templateId !== "preset/web-hd") {
      try {
        await videoTranscoderServiceClient.getJobTemplate({
          name: videoTranscoderServiceClient.jobTemplatePath(
            config_1.default.projectId,
            config_1.default.location,
            templateId
          ),
        });
      } catch (ex) {
        logs.templateDoesNotExist(object.name, templateId);
        return;
      }
    }
    const jobRequest = {
      parent: videoTranscoderServiceClient.locationPath(
        config_1.default.projectId,
        config_1.default.location
      ),
      job: {
        inputUri: `gs://${object.bucket}/${object.name}`,
        outputUri,
        templateId,
      },
    };
    logs.transcodeVideo(object.name, jobRequest);
    try {
      await videoTranscoderServiceClient.createJob(jobRequest);
    } catch (ex) {
      logs.jobFailed(object.name);
      return;
    }
    logs.queued(object.name, outputUri);
  });
//# sourceMappingURL=index.js.map
