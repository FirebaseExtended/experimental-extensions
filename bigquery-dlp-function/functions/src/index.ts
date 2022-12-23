import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import DLP from "@google-cloud/dlp";
import { ConnectionServiceClient } from "@google-cloud/bigquery-connection";
import { BigQuery } from "@google-cloud/bigquery";
import { getExtensions } from "firebase-admin/extensions";

import config from "./config";
import { deidentifyWithInfoTypeTransformations } from "./deidentify";
import { MaskTransformation, RedactTransformation } from "./transofmrations";
import { reidentifyWithInfoTypeTransformations } from "./reidentify";

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
        var transformation;

        switch (config.technique) {
          case "redact":
            transformation = new RedactTransformation();
            break;

          default:
            transformation = new MaskTransformation();
        }
        response.send({
          replies: await deidentifyWithInfoTypeTransformations(
            calls,
            dlp,
            transformation
          ),
        });
      }
      // else if (userDefinedContext.method === "RECORD") {
      //   response.send({
      //     replies: await deidentifyWithRecordTransformations(calls, dlp),
      //   });
      // }
      else {
        response.status(400).send("Invalid method");
      }
    } catch (error) {
      functions.logger.error(error);

      response.status(500).send(`errorMessage: ${error}`);
    }
  }
);

exports.reidentifyData = functions.https.onRequest(
  async (request, response) => {
    const { calls, userDefinedContext } = request.body;

    functions.logger.debug("Incoming request from BigQuery", calls);

    try {
      if (userDefinedContext.method === "INFO_TYPE") {
        var transformation;

        switch (config.technique) {
          default:
            response.status(400).send("Invalid or irreversable technique");
            return;
        }

        response.send({
          replies: await reidentifyWithInfoTypeTransformations(
            calls,
            dlp,
            transformation
          ),
        });
      }
      // else if (userDefinedContext.method === "RECORD") {
      //   response.send({
      //     replies: await deidentifyWithRecordTransformations(calls, dlp),
      //   });
      // }
      else {
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
  .onDispatch(async () => {
    const runtime = getExtensions().runtime();

    const parent = `projects/${config.projectId}/locations/${config.location}`;
    const connectionId = "ext-" + config.extInstanceId;
    var connection;

    try {
      connection = await bigqueryConnectionClient.createConnection({
        parent: parent,
        connectionId: connectionId,
        connection: {
          cloudResource: {
            serviceAccountId: `${connectionId}@${config.projectId}.iam.gserviceaccount.com`,
          },
          name: connectionId,
          friendlyName: "DLP Extension",
        },
      });

      functions.logger.info("Connection successfully created 🎉", connection);
    } catch (error: any) {
      if (error["code"] === 6) {
        functions.logger.info(
          `Connection ${connectionId} already exists, will continue creating functions`
        );
      } else {
        functions.logger.error(error);
        await runtime.setProcessingState(
          "PROCESSING_FAILED",
          "Error creating connection. Check logs for more details."
        );

        return;
      }
    }

    try {
      const query = `
        BEGIN
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.deidentify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${connectionId}\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData',
            user_defined_context = [("method", "${config.method}"), ("technique", "${config.technique}")]
          );
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.reidentify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${connectionId}\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-reidentifyData',
            user_defined_context = [("method", "${config.method}"), ("technique", "${config.technique}")]
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
      await job.getQueryResults();

      await runtime.setProcessingState(
        "PROCESSING_COMPLETE",
        "Connections created successfully."
      );
    } catch (error) {
      functions.logger.error(error);

      await runtime.setProcessingState(
        "PROCESSING_FAILED",
        "Connections were not created."
      );
    }
  });
