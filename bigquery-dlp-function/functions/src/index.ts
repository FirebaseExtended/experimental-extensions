import * as functions from "firebase-functions";
import DLP from "@google-cloud/dlp";
import { ConnectionServiceClient } from "@google-cloud/bigquery-connection";
import config from "./config";
import CallMode from "./types/call_mode";

const CALL_MODE_KEY = "mode";
const TRANSFORM_ALGO_KEY = "algo";

// Instantiates a client
const dlp = new DLP.DlpServiceClient({
  keyFilename: config.servicePath,
});
const bigqueryClient = new ConnectionServiceClient({
  keyFilename: config.servicePath,
});

interface Item {
  value: string;
}

interface BQRequest {
  requestId: string;
  callecallerrIp: string;
  sessionUser: string;
  userDefinedContext: {};
  calls: [];
}

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

/**
 * Deidentify sensitive data in a string using the Data Loss Prevention API.
 *
 * @param {string} text The text to deidentify.
 *
 * @returns {string} The deidentified text.
 */
async function deidentifyWithMask(rows: Item[]) {
  const deidentifiedItems = [];

  const parent = `projects/${config.projectId}/locations/${location}`;

  for (const row of rows) {
    const request = {
      ...deidentifyConfig,
      item: { value: row.value },
      parent: parent,
    };

    const [response] = await dlp.deidentifyContent(request);
    deidentifiedItems.push(response.item?.value);

    console.log(response);
  }

  return deidentifiedItems;
}

export const deidentifyData = functions.https.onCall(async (data, ctx) => {
  const bqrequest = data as BQRequest;

  const options = checkNotNull(bqrequest.userDefinedContext);
  const callMode = identifyCallMode(options);

  switch (callMode) {
    case CallMode.DEIDENTIFY:
      break;
    case CallMode.REIDENTIFY:
      break;
  }

  const items = bqrequest.calls;
  const result = await deidentifyWithMask(items);

  return JSON.stringify(result);
});

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

exports.onInstall = functions.tasks.taskQueue().onDispatch(async (task) => {
  const data = task.data;
  console.log("Task received: ", data);

  const projectId = data.projectId;
  const location = data.location;
  const parent = `projects/${projectId}/locations/${location}`;

  const connection = bigqueryClient.createConnection({
    parent: parent,
    connection: { name: "deidentifyData", cloudResource: {} },
    connectionId: "connectionId",
  });

  console.log("Connection: ", connection);
});
