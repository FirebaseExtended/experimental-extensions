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
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const GMaps = require("@googlemaps/google-maps-services-js");
const config_1 = require("./config");
const utils_1 = require("./utils");
const axios_1 = require("axios");
const gMapsClient = new GMaps.Client();
admin.initializeApp();
exports.writeLatLong = functions.firestore.document(`${config_1.default.collectionId}/{docId}`).onWrite(async (snap) => {
    if (!(0, utils_1.validateAddress)(snap.after, snap.before)) {
        return;
    }
    const { address } = snap.after.data();
    try {
        const result = await geocode(address);
        await snap.after.ref.update({
            ext_getLatLongStatus: {
                status: "OK",
            },
        });
        await snap.after.ref.update(result);
    }
    catch (error) {
        functions.logger.error(error);
        await snap.after.ref.update({
            ext_getLatLongStatus: { status: "ERROR", error: error },
            longitude: firestore_1.FieldValue.delete(),
            latitude: firestore_1.FieldValue.delete(),
        });
    }
});
exports.writeBestDrivingTime = functions.firestore.document(`${config_1.default.collectionId}/{docId}`).onWrite(async (snap) => {
    if (!(0, utils_1.validateOriginAndDestination)(snap.after, snap.before)) {
        return;
    }
    const { origin, destination } = snap.after.data();
    try {
        const result = await bestDriveTime(origin, destination);
        await snap.after.ref.update({
            ext_getBestDriveTimeStatus: {
                status: "OK",
            },
        });
        await snap.after.ref.update({ bestDrivingTime: result });
    }
    catch (error) {
        functions.logger.error(error);
        await snap.after.ref.update({
            ext_getBestDriveTimeStatus: {
                status: "ERROR",
                error: error,
            },
            bestDrivingTime: firestore_1.FieldValue.delete(),
        });
    }
});
/**
 * Call the Google Maps API to the latitude and longitude of an address.
 *
 * @param address a string address to geocode.
 * @returns a stringified JSON object with the lat and long of the address.
 */
async function geocode(address) {
    var _a;
    const result = await gMapsClient.geocode({
        params: {
            key: config_1.default.googleMapsApiKey,
            address: address,
        },
    });
    if (result.data.status !== "OK") {
        throw {
            message: (_a = result.data.error_message) !== null && _a !== void 0 ? _a : "Something went wrong",
            status: result.data.status,
        };
    }
    const location = result.data.results[0].geometry.location;
    return {
        latitude: location.lat,
        longitude: location.lng,
    };
}
/**
 * Get the driving time by seconds between two addresses.
 *
 * @param origin a string adress of the origin.
 * @param destination a string adress of the destination.
 */
async function bestDriveTime(origin, destination) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const result = await gMapsClient.distancematrix({
            params: {
                key: config_1.default.googleMapsApiKey,
                origins: [origin],
                destinations: [destination],
            },
        });
        if (result.data.rows[0].elements[0].status !== "OK") {
            throw {
                message: (_a = result.data.error_message) !== null && _a !== void 0 ? _a : "Something went wrong",
                status: result.data.rows[0].elements[0].status,
            };
        }
        return result.data.rows[0].elements[0].duration.value;
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            throw {
                message: (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error_message) !== null && _d !== void 0 ? _d : "Something went wrong",
                status: (_f = (_e = error.response) === null || _e === void 0 ? void 0 : _e.statusText) !== null && _f !== void 0 ? _f : 500,
            };
        }
        throw error;
    }
}
//# sourceMappingURL=index.js.map