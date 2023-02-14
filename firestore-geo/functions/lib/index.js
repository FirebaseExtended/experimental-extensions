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
exports.writeBestDrivingTime = exports.writeLatLong = exports.updateLatLong = void 0;
const functions = require("firebase-functions");
const firebase_admin_1 = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const utils_1 = require("./utils");
const axios_1 = require("axios");
const config_1 = require("./config");
const tasks_1 = require("./tasks");
const gMapsClient = new google_maps_services_js_1.Client();
(0, firebase_admin_1.initializeApp)();
async function getLatLong(address, docRef) {
    try {
        const result = await geocode(address);
        await docRef.update({
            ext_getLatLongStatus: {
                status: "OK",
            },
        });
        await docRef.update(result);
    }
    catch (error) {
        functions.logger.error(error);
        await docRef.update({
            ext_getLatLongStatus: { status: "ERROR", error: error },
            longitude: firestore_1.FieldValue.delete(),
            latitude: firestore_1.FieldValue.delete(),
        });
    }
}
exports.updateLatLong = functions.tasks.taskQueue().onDispatch(async (message) => {
    const { address, docId } = message.body;
    const doc = (0, firebase_admin_1.firestore)().collection(config_1.default.collectionId).doc(docId);
    try {
        await getLatLong(address, doc);
    }
    catch (error) {
        functions.logger.error(error);
    }
});
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
        // Update the long/lat after 30 days.
        await (0, tasks_1.enqueueTask)(address, snap.after.id);
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
exports.writeBestDrivingTime = functions.firestore
    .document(`${config_1.default.collectionId}/{docId}`)
    .onWrite(async (snap) => {
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
    const result = await gMapsClient.geocode({
        params: {
            key: config_1.default.googleMapsApiKey,
            address: address,
        },
    });
    if (result.data.status !== "OK") {
        throw {
            message: result.data.error_message ?? "Something went wrong",
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
                message: result.data.error_message ?? "Something went wrong",
                status: result.data.rows[0].elements[0].status,
            };
        }
        return result.data.rows[0].elements[0].duration.value;
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            throw {
                message: error.response?.data?.error_message ??
                    "Something went wrong",
                status: error.response?.statusText ?? 500,
            };
        }
        throw error;
    }
}
