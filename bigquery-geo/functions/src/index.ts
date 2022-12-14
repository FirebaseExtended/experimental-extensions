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
import { getExtensions } from "firebase-admin/extensions";

import { BigQuery } from "@google-cloud/bigquery";
import { ConnectionServiceClient } from "@google-cloud/bigquery-connection";
import * as GMaps from "@googlemaps/google-maps-services-js";
import config from "./config";

const gMapsClient = new GMaps.Client();
const bigqueryClient = new BigQuery();
const bigqueryConnectionClient = new ConnectionServiceClient();

admin.initializeApp();

/**
 * Call the Google Maps API to the latitude and longitude of an address.
 *
 * @param address a string address to geocode.
 * @returns a stringified JSON object with the lat and long of the address.
 */
async function getLatLong(address: string): Promise<string> {
  const result = await gMapsClient.geocode({
    params: {
      key: config.googleMapsApiKey!,
      address: address,
    },
  });

  return JSON.stringify(result.data.results[0].geometry.location);
}

/**
 * Get the driving time by seconds between two addresses.
 *
 * @param origin a string adress of the origin.
 * @param destination a string adress of the destination.
 */
async function getDriveTime(origin: string, destination: string) {
  const result = await gMapsClient.distancematrix({
    params: {
      key: config.googleMapsApiKey!,
      origins: [origin],
      destinations: [destination],
    },
  });

  return JSON.stringify(result.data.rows[0].elements[0].duration.value);
}

exports.getLatLong = functions.https.onRequest(async (req, res) => {
  const { calls } = req.body;
  functions.logger.info("BQ Calls ====>", calls);

  const replies = [];

  try {
    for (const call of calls) {
      const address = call[0];
      functions.logger.info("Address", address);

      const result = await getLatLong(address);
      functions.logger.info("RESULT =====>", result);

      replies.push(result);
    }

    res.status(200).json({ replies: replies });
  } catch (error) {
    functions.logger.error(error);
    res.status(500).json({ errorMessage: error });
  }
});

exports.getDrivingTime = functions.https.onRequest(async (req, res) => {
  const { calls } = req.body;
  functions.logger.info("BQ Calls ====>", calls);

  const replies = [];

  try {
    for (const call of calls) {
      const origin = call[0];
      const destination = call[1];
      functions.logger.info("Origin", origin, "Destination", destination);

      const result = await getDriveTime(origin, destination);
      functions.logger.info("RESULT =====>", result);

      replies.push(result);
    }

    res.status(200).json({ replies: replies });
  } catch (error) {
    functions.logger.error(error);
    res.status(500).json({ errorMessage: error });
  }
});

exports.createBigQueryConnection = functions.tasks
  .taskQueue()
  .onDispatch(async (task) => {
    const runtime = getExtensions().runtime();

    console.log("Task received => ", task);

    const parent = `projects/${config.projectId}/locations/${config.location}`;
    const connectionId = `ext-bigquery-geocode`;

    try {
      const connection = await bigqueryConnectionClient.createConnection({
        parent: parent,
        connectionId: connectionId,
        connection: {
          cloudResource: {
            serviceAccountId:
              `ext-bigquery-geo@${config.projectId}.iam.gserviceaccount.com`,
          },
          name: connectionId,
          friendlyName: "Geocode Addresses",
        },
      });

      functions.logger.info("Connection created => ", connection);

      if (connection) {
        const query = `
        BEGIN
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.geocode(call STRING) RETURNS STRING
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${connectionId}\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/ext-bigquery-geocode-getLatLong'
          );
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.drivingTime(call STRING) RETURNS STRING
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${connectionId}\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/ext-bigquery-geocode-getDrivingTime'
          );
        END;
         `;

        const options = {
          query: query,
          location: config.location,
        };

        // Run the query as a job
        const [job] = await bigqueryClient.createQueryJob(options);
        functions.logger.debug(`Job ${job.id} started.`);

        // Wait for the query to finish
        const [rows] = await job.getQueryResults();

        functions.logger.debug("Rows: ", rows);

        await runtime.setProcessingState(
          "PROCESSING_COMPLETE",
          "Connections created successfully."
        );
      }
    } catch (error) {
      functions.logger.error(error);

      await runtime.setProcessingState(
        "PROCESSING_FAILED",
        "Connections were not created."
      );
    }
  });
