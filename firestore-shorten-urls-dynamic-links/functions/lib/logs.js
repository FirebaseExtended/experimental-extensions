"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDocumentComplete = exports.updateDocument = exports.start = exports.shortenUrlComplete = exports.shortenUrl = exports.init = exports.fieldNamesNotDifferent = exports.error = exports.documentUpdatedUnchangedUrl = exports.documentUpdatedNoUrl = exports.documentUpdatedDeletedUrl = exports.documentUpdatedChangedUrl = exports.documentCreatedWithUrl = exports.documentCreatedNoUrl = exports.complete = void 0;
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
const functions = require("firebase-functions");
const config_1 = require("./config");
const complete = () => {
    functions.logger.log("Completed execution of extension");
};
exports.complete = complete;
const documentCreatedNoUrl = () => {
    functions.logger.log("Document was created without a URL, so no processing is required");
};
exports.documentCreatedNoUrl = documentCreatedNoUrl;
const documentCreatedWithUrl = () => {
    functions.logger.log("Document was created with a URL");
};
exports.documentCreatedWithUrl = documentCreatedWithUrl;
const documentUpdatedChangedUrl = () => {
    functions.logger.log("Document was updated: URL has changed");
};
exports.documentUpdatedChangedUrl = documentUpdatedChangedUrl;
const documentUpdatedDeletedUrl = () => {
    functions.logger.log("Document was updated: URL was deleted");
};
exports.documentUpdatedDeletedUrl = documentUpdatedDeletedUrl;
const documentUpdatedNoUrl = () => {
    functions.logger.log("Document was updated: no URL exists, so no processing is required");
};
exports.documentUpdatedNoUrl = documentUpdatedNoUrl;
const documentUpdatedUnchangedUrl = () => {
    functions.logger.log("Document was updated: URL has not changed, so no processing is required");
};
exports.documentUpdatedUnchangedUrl = documentUpdatedUnchangedUrl;
const error = (err) => {
    functions.logger.error("Error when shortening URL", err);
};
exports.error = error;
const fieldNamesNotDifferent = () => {
    functions.logger.error("The `URL` and `Short URL` field names must be different");
};
exports.fieldNamesNotDifferent = fieldNamesNotDifferent;
const init = () => {
    functions.logger.log("Initializing extension with configuration", config_1.default);
};
exports.init = init;
const shortenUrl = (url) => {
    functions.logger.log(`Shortening URL: '${url}'`);
};
exports.shortenUrl = shortenUrl;
const shortenUrlComplete = (shortUrl) => {
    functions.logger.log(`Finished shortening URL to: '${shortUrl}'`);
};
exports.shortenUrlComplete = shortenUrlComplete;
const start = () => {
    functions.logger.log("Started execution of extension with configuration", config_1.default);
};
exports.start = start;
const updateDocument = (path) => {
    functions.logger.log(`Updating Cloud Firestore document: '${path}'`);
};
exports.updateDocument = updateDocument;
const updateDocumentComplete = (path) => {
    functions.logger.log(`Finished updating Cloud Firestore document: '${path}'`);
};
exports.updateDocumentComplete = updateDocumentComplete;
