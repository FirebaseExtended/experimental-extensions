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

import { AudioEncoding, SsmlVoiceGender } from "./types";

interface Config {
  location: string;
  collectionPath: string;
  ssml: boolean;
  languageCode: string;
  audioEncoding: AudioEncoding;
  ssmlGender: SsmlVoiceGender;
  bucketName: string;
  storagePath: string;
  enablePerDocumentOverrides: boolean;
  voiceName: string;
}

const config: Config = {
  location: process.env.LOCATION,
  collectionPath: process.env.COLLECTION_PATH,
  ssml: process.env.SSML === "yes",
  languageCode: process.env.LANGUAGE_CODE,
  audioEncoding: process.env.AUDIO_ENCODING as unknown as AudioEncoding,
  ssmlGender: process.env.SSML_GENDER as unknown as SsmlVoiceGender,
  bucketName: process.env.BUCKET_NAME,
  storagePath: process.env.STORAGE_PATH,
  enablePerDocumentOverrides:
    process.env.ENABLE_PER_DOCUMENT_OVERRIDES === "yes",
  voiceName: process.env.VOICE_NAME,
};

export default config;
