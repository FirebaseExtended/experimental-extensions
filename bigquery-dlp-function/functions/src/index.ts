import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import DLP from "@google-cloud/dlp";
import { ConnectionServiceClient } from "@google-cloud/bigquery-connection";
import { BigQuery } from "@google-cloud/bigquery";
import { getExtensions } from "firebase-admin/extensions";

import config from "./config";

admin.initializeApp();

const dlp = new DLP.DlpServiceClient();
const bigqueryClient = new BigQuery();
const bigqueryConnectionClient = new ConnectionServiceClient();

interface CallerRow {}

interface BQRequest {
  requestId: string;
  callecallerrIp: string;
  sessionUser: string;
  userDefinedContext: {};
  calls: [];
}

interface BQResponse {
  replies?: (null | undefined | string)[];
}

/**
 * Deidentify sensitive data in a string using the Data Loss Prevention API.
 *
 * @param {string} text The text to deidentify.
 *
 * @returns {string} The deidentified text.
 */
async function deidentifyWithMask(rows: CallerRow[]) {
  const deidentifiedItems = [];

  const parent = `projects/${config.projectId}/locations/${config.location}`;
  const deidentifyConfig = {
    parent: parent,
    deidentifyConfig: {
      infoTypeTransformations: {
        transformations: [
          {
            primitiveTransformation: {
              characterMaskConfig: {
                maskingCharacter: "x",
                numberToMask: 5,
              },
            },
          },
        ],
      },
    },
  };

  for (const row of rows) {
    for (const value in row) {
      const request = {
        ...deidentifyConfig,
        item: { value: value },
        parent: parent,
      };
      const [response] = await dlp.deidentifyContent(request);
      deidentifiedItems.push(response.item?.value);

      functions.logger.debug(response);
    }
  }

  return deidentifiedItems;
}

exports.deidentifyData = functions.https.onRequest(
  async (request, response) => {
    const { calls } = request.body as BQRequest;

    functions.logger.debug("Incoming request from BigQuery", request.body);

    try {
      const bqResponse: BQResponse = {
        replies: await deidentifyWithMask(calls),
      };
      response.send(bqResponse);
    } catch (error) {
      functions.logger.error(error);

      response.status(500).send(`errorMessage: ${error}`);
    }
  }
);

exports.createBigQueryConnection = functions.tasks
  .taskQueue()
  .onDispatch(async (task) => {
    const runtime = getExtensions().runtime();

    console.log("Task received => ", task);

    const parent = `projects/${config.projectId}/locations/${config.location}`;
    const connectionIdPrefix = `ext-bq-dlp-`;

    try {
      const connection1 = await bigqueryConnectionClient.createConnection({
        parent: parent,
        connectionId: `${connectionIdPrefix}deidentify`,
        connection: {
          cloudResource: {
            serviceAccountId:
              "ext-bigquery-dlp-function@extensions-testing.iam.gserviceaccount.com",
          },
          name: `${connectionIdPrefix}deidentify`,
          friendlyName: "Deidentify Data",
        },
      });

      const connection2 = await bigqueryConnectionClient.createConnection({
        parent: parent,
        connectionId: `${connectionIdPrefix}reidentify`,
        connection: {
          cloudResource: {
            serviceAccountId:
              "ext-bigquery-dlp-function@extensions-testing.iam.gserviceaccount.com",
          },
          name: `${connectionIdPrefix}reidentify`,
          friendlyName: "Reidentify Data",
        },
      });

      functions.logger.info("Connection 1 created => ", connection1);
      functions.logger.info("Connection 2 created => ", connection2);

      if (connection1 && connection2) {
        const query = `
        BEGIN
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.deindetify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${connectionIdPrefix}deidentify\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData'
          );
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.reindetify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${connectionIdPrefix}reidentify\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData'
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