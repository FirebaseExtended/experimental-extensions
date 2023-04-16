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
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const vision_1 = require("@google-cloud/vision");
const logs = require("./logs");
const config_1 = require("./config");
const util_1 = require("./util");
admin.initializeApp();
const client = new vision_1.ImageAnnotatorClient();
exports.extractText = functions.storage.object().onFinalize(async (object) => {
    if (!(0, util_1.shouldExtractText)(object)) {
        return;
    }
    const bucket = admin.storage().bucket(object.bucket);
    const imageContents = await bucket.file(object.name).download();
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
        logs.imageExtractionFailed(object.name);
        return;
    }
    logs.successfulImageExtraction(object.name);
    if (textAnnotations.length === 0 || !textAnnotations[0].description) {
        logs.noTextFound(object.name);
        await admin
            .firestore()
            .collection(config_1.default.collectionPath)
            .doc(object.name)
            .set({
            file: filePath,
            text: null,
        });
        return;
    }
    const extractedText = textAnnotations[0].description;
    const data = config_1.default.detail === "basic"
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
        .collection(config_1.default.collectionPath)
        .doc(object.name)
        .set(data);
});
