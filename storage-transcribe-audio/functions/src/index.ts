/*
 * Copyright 2022 Google LLC
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
import * as admin from "firebase-admin";
import { getEventarc, Channel } from "firebase-admin/eventarc";
import * as speech from "@google-cloud/speech";
import * as path from "path";
import * as os from "os";

import * as logs from "./logs";
import {
  publishFailureEvent,
  errorFromAny,
  publishCompleteEvent,
} from "./util";
import mkdirp = require("mkdirp");
import {
  transcodeToLinear16AndUpload,
  transcribeAndUpload,
} from "./transcribe-audio";

admin.initializeApp();

const eventChannel: Channel | null = process.env.EXT_SELECTED_EVENTS
  ? getEventarc().channel(process.env.EXT_SELECTED_EVENTS, {
      allowedEventTypes: process.env.EXT_SELECTED_EVENTS,
    })
  : null;

logs.init();

const client = new speech.SpeechClient();

// TODO(reao): Write to firestore if that setting is enabled
// TODO(reao): Don't write to storage if that setting is not enabled
export const transcribeAudio = functions.storage
  .object()
  .onFinalize(async (object): Promise<void> => {
    logs.start();
    const { contentType } = object; // the MIME type

    if (object.metadata && object.metadata.isTranscodeOutput === "true") {
      logs.audioAlreadyProcessed();
      return;
    }

    if (!contentType) {
      logs.noContentType();
      return;
    }

    if (!contentType.startsWith("audio/")) {
      logs.contentTypeInvalid(contentType);
      return;
    }

    if (object.name === undefined) {
      logs.undefinedObjectName(object);
      return;
    }

    const bucket = admin.storage().bucket(object.bucket);
    const filePath = object.name;

    try {
      const localCopyPath: string = path.join(os.tmpdir(), filePath);
      const tempLocalDir = path.dirname(localCopyPath);

      logs.tempDirectoryCreating(tempLocalDir);
      await mkdirp(tempLocalDir);
      logs.tempDirectoryCreated(tempLocalDir);

      const remoteFile = bucket.file(filePath);
      logs.audioDownloading(filePath);
      await remoteFile.download({ destination: localCopyPath });
      logs.audioDownloaded(filePath, localCopyPath);

      const transcodeResult = await transcodeToLinear16AndUpload(
        {
          localCopyPath,
          storageOutputPath: "out.wav",
        },
        bucket
      );

      if (transcodeResult.state === "failure") {
        logs.transcodingFailed(transcodeResult);
        if (eventChannel) {
          await publishFailureEvent(eventChannel, transcodeResult);
        }
        return;
      }

      const { sampleRateHertz, audioChannelCount } = transcodeResult;
      const {
        uploadResponse: [file /* metadata */],
      } = transcodeResult;

      const transcriptionResult = await transcribeAndUpload({
        client,
        file,
        sampleRateHertz,
        audioChannelCount,
      });

      if (transcriptionResult.state === "failure") {
        logs.transcribingFailed(transcriptionResult);
        if (eventChannel) {
          await publishFailureEvent(eventChannel, transcriptionResult);
        }
        return;
      }

      if (eventChannel) {
        await publishCompleteEvent(eventChannel, transcriptionResult);
      }
      return;
    } catch (err) {
      const error = errorFromAny(err);
      logs.error(error);

      if (eventChannel) {
        await eventChannel.publish({
          type: "firebase.extensions.storage-transcribe-audio.v1.fail",
          data: {
            error,
          },
        });
      }
    }
  });
