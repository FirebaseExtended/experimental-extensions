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
import * as admin from "firebase-admin";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import * as logs from "./logs";
import config from "./config";
import { shouldExtractText } from "./util";

admin.initializeApp();
const client = new ImageAnnotatorClient();

exports.extractText = functions.storage.object().onFinalize(async (object) => {
  if (!shouldExtractText(object)) {
    return;
  }

  const bucket = admin.storage().bucket(object.bucket);
  const imageContents = await bucket.file(object.name!).download();
  const imageBase64 = Buffer.from(imageContents[0]).toString("base64");
  const request = {
    image: {
      content: imageBase64,
    },
    features: [
      {
        type: "TEXT_DETECTION",
      },
    ],
  };

  const filePath = `gs://${object.bucket}/${object.name}`;

  const [results] = await client.annotateImage(request);

  const textAnnotations = results.textAnnotations;

  if (!textAnnotations) {
    logs.imageExtractionFailed(object.name!);
    return;
  }

  logs.successfulImageExtraction(object.name!);

  if (textAnnotations.length === 0 || !textAnnotations[0].description) {
    logs.noTextFound(object.name!);

    await admin
      .firestore()
      .collection(config.collectionPath)
      .doc(object.name!)
      .set({
        file: filePath,
        text: null,
      });

    return;
  }

  const extractedText = textAnnotations[0].description;

  const data =
    config.detail === "basic"
      ? {
          file: `gs://${object.bucket}/${object.name}`,
          text: extractedText,
        }
      : {
          file: `gs://${object.bucket}/${object.name}`,
          textAnnotations,
        };

  await admin
    .firestore()
    .collection(config.collectionPath)
    .doc(object.name!)
    .set(data);
});
