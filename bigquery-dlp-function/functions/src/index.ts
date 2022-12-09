import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import DLP from "@google-cloud/dlp";
import { ConnectionServiceClient } from "@google-cloud/bigquery-connection";
import { BigQuery } from "@google-cloud/bigquery";
import { getExtensions } from "firebase-admin/extensions";

import config from "./config";
import CallMode from "./types/call_mode";

const CALL_MODE_KEY = "mode";

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

export const deidentifyData = functions.https.onRequest(
  async (request, response) => {
    const { calls } = request.body as BQRequest;

    functions.logger.debug("Incoming request from BigQuery", request.body);

    // const options = checkNotNull(userDefinedContext);
    // const callMode = identifyCallMode(options);

    // switch (callMode) {
    //   case CallMode.DEIDENTIFY:
    //     break;
    //   case CallMode.REIDENTIFY:
    //     break;
    // }

    try {
      const result = await deidentifyWithMask(calls);
      response.send(JSON.stringify({ replies: result }));
    } catch (error) {
      response.status(500).send(`Something wrong happend ${error}`);
    }
  }
);

function checkNotNull(options: BQRequest["userDefinedContext"]) {
  if (options == null) {
    throw new Error("userDefinedContext is required. Found null.");
  }

  return { replies: options };
}

function identifyCallMode(options: any): string {
  var callMode =
    CALL_MODE_KEY in options ? (options[CALL_MODE_KEY] as string) : null;

  if (CALL_MODE_KEY in options) {
    const callModeEnum = callMode as CallMode;

    return callModeEnum;
  } else {
    return CallMode.DEIDENTIFY;
  }
}

exports.createBigQueryConnection = functions.tasks
  .taskQueue()
  .onDispatch(async (task) => {
    const runtime = getExtensions().runtime();

    console.log("Task received => ", task);

    const parent = `projects/${config.projectId}/locations/${config.location}`;

    functions.logger.debug(`${parent}/connections/deidentify`);

    try {
      const connection1 = await bigqueryConnectionClient.createConnection({
        parent: parent,
        connectionId: `${parent}/connections/deidentify`,
        connection: {
          cloudResource: {
            serviceAccountId:
              "ext-bigquery-dlp-function@extensions-testing.iam.gserviceaccount.com",
          },
          name: "deidentify",
          friendlyName: "Deidentify Data",
        },
      });

      const connection2 = await bigqueryConnectionClient.createConnection({
        parent: parent,
        connectionId: `projects/${config.projectId}/locations/${config.location}/connections/reidentify`,
        connection: {
          cloudResource: {
            serviceAccountId:
              "ext-bigquery-dlp-function@extensions-testing.iam.gserviceaccount.com",
          },
          name: "reidentify",
          friendlyName: "Reidentify Data",
        },
      });

      functions.logger.info("Connection 1 => ", connection1);
      functions.logger.info("Connection 2 => ", connection2);

      if (connection1 && connection2) {
        const query = `CREATE FUNCTION \`${config.projectId}.${config.datasetId}\`.deindetify(data STRING) RETURNS STRING
      REMOTE WITH CONNECTION \`${config.projectId}.${config.location}.ext-bq-dlp.deidentify\`
      OPTIONS (
        endpoint = 'https://${config.location}-${config.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData'
      )`;

        const options = {
          query: query,
          location: "US",
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
