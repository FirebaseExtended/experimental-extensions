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

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue, DocumentReference } from "firebase-admin/firestore";

import {
  Client as MapsClient,
  DistanceMatrixResponseData,
} from "@googlemaps/google-maps-services-js";
import { AxiosError } from "axios";

import { validateAddress, validateOriginAndDestination } from "./utils";
import { enqueueTask } from "./tasks";
import config from "./config";

const gMapsClient = new MapsClient();

admin.initializeApp();

async function getLatLong(address: string, docRef: DocumentReference) {
  try {
    const result = await geocode(address);

    await docRef.update({
      ext_getLatLongStatus: {
        status: "OK",
      },
    });

    await docRef.update(result);
  } catch (error) {
    functions.logger.error(error);
    await docRef.update({
      ext_getLatLongStatus: { status: "ERROR", error: error },
      longitude: FieldValue.delete(),
      latitude: FieldValue.delete(),
    });
  }
}

export const updateLatLong = functions
  .runWith({ secrets: [`ext-${process.env.EXT_INSTANCE_ID}-MAPS_API_KEY`] })
  .tasks.taskQueue()
  .onDispatch(async (message) => {
    const { address, docId } = message as {
      address: string;
      docId: string;
    };

    const doc = admin.firestore().collection(config.collectionId).doc(docId);
    const getDoc = await doc.get();
    if (getDoc.updateTime) {
      const ThirtyDaysAgo =
        admin.firestore.Timestamp.now().seconds - 60 * 60 * 24 * 30;

      if (getDoc.updateTime.seconds >= ThirtyDaysAgo) {
        // Abort if the document has been updated in the last 30 days.
        return;
      }
    }

    try {
      await getLatLong(address, doc);
    } catch (error) {
      functions.logger.error(error);
    }
  });

export const writeLatLong = functions.firestore
  .document(`${config.collectionId}/{docId}`)
  .onWrite(
    async (snap: functions.Change<functions.firestore.DocumentSnapshot>) => {
      if (!validateAddress(snap)) {
        return;
      }

      const currentSnap = snap.after.exists ? snap.after : snap.before;
      const currentSnapData = currentSnap.data();

      const { address } = currentSnapData as {
        address: string;
        ext_getLatLongStatus?: {
          status: "OK" | "ERROR";
          error?: string;
        };
      };

      try {
        await getLatLong(address, currentSnap.ref);

        /** Run exponential backoff to catch any errors */
        await enqueueTask(address, currentSnap.id);
      } catch (error) {
        functions.logger.error(error);
        await snap.after.ref.update({
          ext_getLatLongStatus: {
            status: "ERROR",
            error: JSON.stringify(error),
          },
          longitude: FieldValue.delete(),
          latitude: FieldValue.delete(),
        });
      }
    }
  );

export const writeBestDrivingTime = functions.firestore
  .document(`${config.collectionId}/{docId}`)
  .onWrite(async (snap) => {
    if (!validateOriginAndDestination(snap.after, snap.before)) {
      return;
    }

    const { origin, destination } = snap.after.data() as {
      origin: string;
      destination: string;
    };

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
        bestDrivingTime: FieldValue.delete(),
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
  try {
    const result = await gMapsClient.distancematrix({
      params: {
        key: config.googleMapsApiKey!,
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
  } catch (error: any) {
    if (error instanceof AxiosError) {
      throw {
        message:
          (
            (error as AxiosError).response?.data as
              | DistanceMatrixResponseData
              | undefined
          )?.error_message ?? "Something went wrong",
        status: (error as AxiosError).response?.statusText ?? 500,
      };
    }

    throw error;
  }
}
