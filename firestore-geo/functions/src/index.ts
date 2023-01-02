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

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import * as GMaps from "@googlemaps/google-maps-services-js";
import config from "./config";

const gMapsClient = new GMaps.Client();

admin.initializeApp();

type GeoError = {
  status: string;
  message?: string;
};

exports.writeLatLong = functions.firestore
  .document(`${config.collectionId}/{docId}`)
  .onWrite(async (snap, ctx) => {
    if (ctx.eventType === "google.firestore.document.delete") return;

    const { address } = snap.after.data() as {
      address?: string;
    };

    if (!address || snap.before.data()?.address === address) return;
    try {
      const result = await geocode(address);

      await snap.after.ref.update({
        ext_getLatLongStatus: {
          status: "OK",
        },
      });

      await snap.after.ref.update(result);
    } catch (error) {
      functions.logger.error(error);
      await snap.after.ref.update({
        ext_getLatLongStatus: { status: "ERROR", error: error },
        longitude: FieldValue.delete(),
        latitude: FieldValue.delete(),
      });
    }
  });

exports.writeBestDrivingTime = functions.firestore
  .document(`${config.collectionId}/{docId}`)
  .onWrite(async (snap, ctx) => {
    if (ctx.eventType === "google.firestore.document.delete") return;

    const { origin, destination } = snap.after.data() as {
      origin?: string;
      destination?: string;
    };

    if (!origin || !destination)
      throw new Error("Missing origin or destination");

    try {
      const result = await bestDriveTime(origin, destination);
      await snap.after.ref.update({
        ext_getBestDriveTimeStatus: {
          status: "OK",
        },
      });

      await snap.after.ref.update({ bestDrivingTime: result });
    } catch (error) {
      functions.logger.error(error);
      await snap.after.ref.update({
        ext_getBestDriveTimeStatus: {
          status: "ERROR",
          error: error,
        },
        bestDriveTime: FieldValue.delete(),
      });
    }
  });

/**
 * Call the Google Maps API to the latitude and longitude of an address.
 *
 * @param address a string address to geocode.
 * @returns a stringified JSON object with the lat and long of the address.
 */
async function geocode(
  address: string
): Promise<{ latitude: number; longitude: number }> {
  const result = await gMapsClient.geocode({
    params: {
      key: config.googleMapsApiKey!,
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
async function bestDriveTime(origin: string, destination: string) {
  const result = await gMapsClient.distancematrix({
    params: {
      key: config.googleMapsApiKey!,
      origins: [origin],
      destinations: [destination],
    },
  });

  functions.logger.log(result.data.rows[0].elements[0].status);

  if (result.data.rows[0].elements[0].status !== "OK") {
    throw {
      message: result.data.error_message ?? "Something went wrong",
      status: result.data.rows[0].elements[0].status,
    };
  }

  return result.data.rows[0].elements[0].duration.value;
}
