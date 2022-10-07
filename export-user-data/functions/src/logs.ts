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

import { logger } from "firebase-functions";
import config from "./config";

export const completeExport = (uid: string) => {
  logger.log(`Successfully exported data for user: ${uid}`);
};

export const firestoreExported = () => {
  logger.log("Finished Exporting user data from Cloud Firestore");
};

export const firestoreExporting = () => {
  logger.log("Exporting user data from Cloud Firestore");
};

export const firestoreConfigPathsNotConfigured = () => {
  logger.log("Cloud Firestore paths are not configured, skipping");
};

export const customHookNotConfigured = () => {
  logger.log("paths from a custom hook are not configured, skipping");
};

export const firestorePathExported = (path: string) => {
  logger.log(`Exported: '${path}' from Cloud Firestore`);
};

export const storagePathExported = (path: string) => {
  logger.log(`Exported: '${path}' from Cloud Storage`);
};

export const firestorePathExporting = (path: string) => {
  logger.log(`Exporting: '${path}' from Cloud Firestore`);
};

export const exportError = (err: Error, path?: string) => {
  if (path) {
    logger.error(`Error exporting: '${path}'`, err);
  } else {
    logger.error("Error exporting", err);
  }
};

export const firestorePathNotString = () => {
  logger.error(
    "Firestore paths must be strings, skipping. Check your custom hook response."
  );
};

export const rtdbPathNotString = () => {
  logger.error(
    "Database paths must be strings, skipping. Check your custom hook response."
  );
};

export const storagePathNotString = () => {
  logger.error(
    "Storage paths must be strings, skipping. Check your custom hook response."
  );
};

export const init = () => {
  logger.log("Initializing extension with configuration", config);
};

export const rtdbPathExported = (path: string) => {
  logger.log(`Exported: '${path}' from the Realtime Database`);
};

export const rtdbConfigPathsNotConfigured = () => {
  logger.log("Realtime Database paths are not configured, skipping");
};

export const rtdbPathExporting = (path: string) => {
  logger.log(`Exporting: '${path}' from the Realtime Database`);
};

export const rtdbPathError = (path: string, err: Error) => {
  logger.error(
    `Error when Exporting: '${path}' from the Realtime Database`,
    err
  );
};

export const startExport = (uid: string) => {
  logger.log(
    `Started extension execution with configuration for ${uid}`,
    config
  );
};

export const storagePath404 = (path: string) => {
  logger.log(`File: '${path}' does not exist in Cloud Storage, skipping`);
};

export const storagePathError = (path: string, err: Error) => {
  logger.error(`Error Exporting: '${path}' from Cloud Storage`, err);
};

export const StoragePathExporting = (path: string) => {
  logger.log(`Exporting: '${path}' from Cloud Storage`);
};

export const StoragePathExported = (path: string) => {
  logger.log(`Exported: '${path}' from Cloud Storage`);
};

export const customHookBadResponse = (endpoint: string) => {
  logger.error(
    `Custom hook endpoint ${endpoint} did not return a 200 response`
  );
};

export const customHookInvalidData = (endpoint: string) => {
  logger.error(
    `Custom hook endpoint ${endpoint} did not return JSON in the valid format`
  );
};

export const rtdbLocationNotConfigured = () => {
  logger.log(
    "Realtime Database paths are provided but no database location is configured, skipping Realtime Database exports"
  );
};

export const storageConfigPathsNotConfigured = () => {
  logger.log("Cloud Storage paths are not configured, skipping");
};

export const genericLog = (message: string) => {
  logger.log(message);
};
