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

import { logger } from "firebase-functions";
import config from "./config";

export const obfuscatedConfig = {
  ...config,
};

export const init = () => {
  logger.log("Initializing extension with configuration", obfuscatedConfig);
};

export const webConfigError = (err: Error) => {
  if (config.webAppId) {
    logger.error(
      `Error fetching web config, do you have access to the Web App with ID ${
        config.webAppId
      }?`,
      err
    );
  } else {
    logger.error(
      `Error fetching a Web App configuration, have you created one?`,
      err
    );
  }
};

export const downloadSchemaError = (e: Error) => {
  logger.error(
    `Error downloading schema on Bucket "${config.storageBucket}" at path "${
      config.schemaPath
    }"`,
    e
  );
};
