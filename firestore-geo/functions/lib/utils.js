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
    var _a, _b;
    // If the document was deleted, terminate.
    if (!(after === null || after === void 0 ? void 0 : after.data()) || !after.exists) {
        return false;
    }
    const address = (_a = after.data()) === null || _a === void 0 ? void 0 : _a.address;
    if (!address) {
        return false;
    }
    if (((_b = before === null || before === void 0 ? void 0 : before.data()) === null || _b === void 0 ? void 0 : _b.address) === address) {
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
    var _a, _b, _c, _d;
    // If the document was deleted, terminate.
    if (!(after === null || after === void 0 ? void 0 : after.data()) || !after.exists) {
        return false;
    }
    const destination = (_a = after.data()) === null || _a === void 0 ? void 0 : _a.destination;
    const origin = (_b = after.data()) === null || _b === void 0 ? void 0 : _b.origin;
    if (!destination || !origin) {
        return false;
    }
    if (((_c = before === null || before === void 0 ? void 0 : before.data()) === null || _c === void 0 ? void 0 : _c.destination) === destination && ((_d = before === null || before === void 0 ? void 0 : before.data()) === null || _d === void 0 ? void 0 : _d.origin) === origin) {
        return false;
    }
    if (typeof destination !== "string" || typeof origin !== "string") {
        functions.logger.error("Type of origin and destination must be a string");
        return false;
    }
    return true;
}
exports.validateOriginAndDestination = validateOriginAndDestination;
//# sourceMappingURL=utils.js.map