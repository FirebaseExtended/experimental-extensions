"use strict";
/*
 * Copyright 2023 Google LLC
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
exports.validateOriginAndDestination = exports.validateAddress = void 0;
const functions = require("firebase-functions");
function validateAddress(after, before) {
    // If the document was deleted, terminate.
    if (!after?.data() || !after.exists) {
        return false;
    }
    const address = after.data()?.address;
    if (!address) {
        return false;
    }
    if (before?.data()?.address === address) {
        return false;
    }
    if (typeof address !== "string") {
        functions.logger.error("Type of address must be a string");
        return false;
    }
    return true;
}
exports.validateAddress = validateAddress;
function validateOriginAndDestination(after, before) {
    // If the document was deleted, terminate.
    if (!after?.data() || !after.exists) {
        return false;
    }
    const destination = after.data()?.destination;
    const origin = after.data()?.origin;
    if (!destination || !origin) {
        return false;
    }
    if (before?.data()?.destination === destination && before?.data()?.origin === origin) {
        return false;
    }
    if (typeof destination !== "string" || typeof origin !== "string") {
        functions.logger.error("Type of origin and destination must be a string");
        return false;
    }
    return true;
}
exports.validateOriginAndDestination = validateOriginAndDestination;
