import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { DlpServiceClient } from "@google-cloud/dlp";
import { ConnectionServiceClient } from "@google-cloud/bigquery-connection";
import { BigQuery } from "@google-cloud/bigquery";
import { getExtensions } from "firebase-admin/extensions";

import config from "./config";
import {
  deidentifyWithInfoTypeTransformations,
  deidentifyWithRecordTransformations,
} from "./deidentify";
import {
  MaskTransformation,
  RedactTransformation,
  ReplaceTransformation,
  ReplaceWithInfoTypeTransformation,
} from "./transofmrations";
import { reidentifyWithInfoTypeTransformations } from "./reidentify";

admin.initializeApp();

const bigqueryClient = new BigQuery();
const bigqueryConnectionClient = new ConnectionServiceClient();

const dlp = new DlpServiceClient();

exports.deidentifyData = functions.https.onRequest(
  async (request, response) => {
    const { calls } = request.body;

    functions.logger.debug("Incoming request from BigQuery", calls);
    var transformation;

    switch (config.technique) {
      case "redact":
        transformation = new RedactTransformation();
        break;
      case "fixed":
        transformation = new ReplaceTransformation();
        break;
      case "replaceWithInfoType":
        transformation = new ReplaceWithInfoTypeTransformation();
        break;
      default:
        transformation = new MaskTransformation();
    }

    try {
      switch (config.method) {
        case "INFO_TYPE":
          response.send({
            replies: await deidentifyWithInfoTypeTransformations(
              calls,
              dlp,
              transformation
            ),
          });
          break;
        case "RECORD":
          response.send({
            replies: await deidentifyWithRecordTransformations(
              calls,
              dlp,
              transformation
            ),
          });
          break;
        default:
          response.status(400).send({ errorMessage: "Invalid method" });
          break;
      }
    } catch (error) {
      functions.logger.error(error);

      response.status(400).send({ errorMessage: error });
    }
  }
);

exports.reidentifyData = functions.https.onRequest(
  async (request, response) => {
    const { calls } = request.body;

    functions.logger.debug("Incoming request from BigQuery", calls);

    var transformation;

    switch (config.technique) {
      default:
        response.status(400).send("Invalid or irreversable technique");
        return;
    }

    try {
      if (config.method === "INFO_TYPE") {
        response.send({
          replies: await reidentifyWithInfoTypeTransformations(
            calls,
            dlp,
            transformation
          ),
        });
      } else if (config.method === "RECORD") {
        response.send({
          replies: await deidentifyWithRecordTransformations(
            calls,
            dlp,
            transformation
          ),
        });
      } else {
        response.status(400).send("Invalid method");
      }
    } catch (error) {
      functions.logger.error(error);
      response.status(400).send({ errorMessage: error });
    }
  }
);

export const createBigQueryConnection = functions.tasks
  .taskQueue()
  .onDispatch(async () => {
    const runtime = getExtensions().runtime();

    const parent = `projects/${config.projectId}/locations/${config.location}`;
    const instanceId = "ext-" + config.extInstanceId;
    var connection;

    try {
      connection = await bigqueryConnectionClient.createConnection({
        parent: parent,
        connectionId: instanceId,
        connection: {
          cloudResource: {
            serviceAccountId: `${instanceId}@${config.projectId}.iam.gserviceaccount.com`,
          },
          name: instanceId,
          friendlyName: "DLP Extension",
        },
      });

      functions.logger.info("Connection successfully created 🎉", connection);
    } catch (error: any) {
      if (error["code"] === 6) {
        functions.logger.warn(
          `Connection ${instanceId} already exists, will continue creating functions`
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
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${instanceId}\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/${instanceId}-deidentifyData'
          );
          CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.reidentify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.${instanceId}\`
          OPTIONS (
            endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/${instanceId}-reidentifyData'          
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
    } catch (error: any) {
      if (error["code"] === 6) {
        functions.logger.warn(`Functions already exists.`);
      } else {
        functions.logger.error(error);

        await runtime.setProcessingState(
          "PROCESSING_FAILED",
          "Connections were not created, check logs for more details."
        );

        return;
      }
    }
  });
