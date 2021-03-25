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
import videoIntelligence from "@google-cloud/video-intelligence";

import config from "./config";

const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

const validMediaTypes = [".mp4"];

exports.analyse = functions.storage.object().onFinalize(async object => {
  if (!validMediaTypes.includes(object.name?.toLowerCase() || "")) return;

  const client = new videoIntelligence.VideoIntelligenceServiceClient();

  const [operation] = await client.annotateVideo({
    inputUri: config.inputUri,
    features: config.labelDetection as any,
    videoContext: {
      labelDetectionMode: 1,
      videoConfidenceThreshold: 0.5,
    } as any,
  });

  const [operationResult] = await operation.promise();

  if (!operationResult || !operationResult.annotationResults) {
    return;
  }

  const text = operationResult.annotationResults[0];

  await db
    .collection(config.collectionPath)
    .doc(object.name)
    .create({
      file: "gs://" + object.bucket + "/" + object.name,
      text,
    });
});
