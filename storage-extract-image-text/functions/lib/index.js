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
const vision_1 = require("@google-cloud/vision");
const config_1 = require("./config");
const admin = require("firebase-admin");
admin.initializeApp();
const client = new vision_1.default.ImageAnnotatorClient();
const db = admin.firestore();
exports.extractText = functions.storage.object().onFinalize(async (object) => {
    var _a, _b, _c, _d, _e, _f;
    // TODO: allow configuration.
    if (!((_a = object.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().endsWith(".jpg")) &&
        !((_b = object.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().endsWith(".jpeg")) &&
        !((_c = object.name) === null || _c === void 0 ? void 0 : _c.toLowerCase().endsWith(".png"))) {
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
    const results = await client.annotateImage(request);
    const extractedText = (_f = (_e = (_d = results === null || results === void 0 ? void 0 : results[0]) === null || _d === void 0 ? void 0 : _d.textAnnotations) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.description;
    await db
        .collection(config_1.default.collectionPath)
        .doc(object.name)
        .create({
        file: "gs://" + object.bucket + "/" + object.name,
        text: extractedText,
    });
});
//# sourceMappingURL=index.js.map