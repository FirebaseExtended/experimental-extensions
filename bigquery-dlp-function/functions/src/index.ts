import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import DLP from "@google-cloud/dlp";
import { ConnectionServiceClient } from "@google-cloud/bigquery-connection";
import { BigQuery } from "@google-cloud/bigquery";
import { getExtensions } from "firebase-admin/extensions";

import config from "./config";
import {
  deidentifyWithInfoTypeTransformations,
  deidentifyWithRecordTransformations,
} from "./deidentify";

admin.initializeApp();

const dlp = new DLP.DlpServiceClient();
const bigqueryClient = new BigQuery();
const bigqueryConnectionClient = new ConnectionServiceClient();

exports.deidentifyData = functions.https.onRequest(
  async (request, response) => {
    const { calls, userDefinedContext } = request.body;

    functions.logger.debug("Incoming request from BigQuery", calls);

    try {
      if (userDefinedContext.method === "INFO_TYPE") {
        response.send({
          replies: await deidentifyWithInfoTypeTransformations(calls, dlp),
        });
      } else if (userDefinedContext.method === "RECORD") {
        response.send({
          replies: await deidentifyWithRecordTransformations(calls, dlp),
        });
      } else {
        response.status(400).send("Invalid method");
      }
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
    const connectionId = `ext-bigquery-dlp-function`;

    try {
      const connection = await bigqueryConnectionClient.createConnection({
        parent: parent,
        connectionId: connectionId,
        connection: {
          cloudResource: {
            serviceAccountId: `ext-bigquery-dlp-function@${config.projectId}.iam.gserviceaccount.com`,
          },
          name: connectionId,
          friendlyName: "Deidentify Data",
        },
      });

      functions.logger.info("Connection 1 created => ", connection);

      if (connection) {
        const query = `
        BEGIN
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.deidentify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${connectionId}\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData',
            user_defined_context = [("method", "${config.method}")]
          );
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.reindetify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${connectionId}\`
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
