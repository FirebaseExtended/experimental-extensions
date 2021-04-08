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
import * as videoTranscoder from "@google-cloud/video-transcoder";
import { google } from "@google-cloud/video-transcoder/build/protos/protos";

import config from "./config";
import * as logs from "./logs";
import { shouldProcessStorageObject } from "./utils";
import ICreateJobRequest = google.cloud.video.transcoder.v1beta1.ICreateJobRequest;

const videoTranscoderServiceClient = new videoTranscoder.TranscoderServiceClient();

logs.init();

exports.transcodevideo = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (!object.name) return;
    if (!shouldProcessStorageObject(object.name)) return;

    // `videoTranscoderTemplateId` can be specified on the storage objects metadata to override
    // the template that is used to transcode the incoming video. Defaults to `DEFAULT_TEMPLATE_ID`
    // from the Firebase Extension parameters.
    const templateId: string =
      object.metadata?.videoTranscoderTemplateId || config.defaultTemplateId;

    // Output to a folder named the same as the original file, minus the file extension.
    const outputUri = `gs://${config.outputVideosBucket}${
      config.outputVideosPath
    }${path.basename(object.name)}/`;

    // Ensure the template exists if not using the known web-hd preset.
    if (templateId !== "preset/web-hd") {
      try {
        await videoTranscoderServiceClient.getJobTemplate({
          name: videoTranscoderServiceClient.jobTemplatePath(
            config.projectId,
            config.location,
            templateId
          ),
        });
      } catch (ex) {
        logs.templateDoesNotExist(object.name, templateId);
        return;
      }
    }

    const jobRequest: ICreateJobRequest = {
      parent: videoTranscoderServiceClient.locationPath(
        config.projectId,
        config.location
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
