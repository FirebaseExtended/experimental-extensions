"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deidentifyData = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const dlp_1 = require("@google-cloud/dlp");
const bigquery_connection_1 = require("@google-cloud/bigquery-connection");
const bigquery_1 = require("@google-cloud/bigquery");
const extensions_1 = require("firebase-admin/extensions");
const config_1 = require("./config");
const call_mode_1 = require("./types/call_mode");
const CALL_MODE_KEY = "mode";
admin.initializeApp();
const dlp = new dlp_1.default.DlpServiceClient();
const bigqueryClient = new bigquery_1.BigQuery();
const bigqueryConnectionClient = new bigquery_connection_1.ConnectionServiceClient();
/**
 * Deidentify sensitive data in a string using the Data Loss Prevention API.
 *
 * @param {string} text The text to deidentify.
 *
 * @returns {string} The deidentified text.
 */
async function deidentifyWithMask(rows) {
    var _a;
    const deidentifiedItems = [];
    const parent = `projects/${config_1.default.projectId}/locations/${config_1.default.location}`;
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
            const request = Object.assign(Object.assign({}, deidentifyConfig), { item: { value: value }, parent: parent });
            const [response] = await dlp.deidentifyContent(request);
            deidentifiedItems.push((_a = response.item) === null || _a === void 0 ? void 0 : _a.value);
            functions.logger.debug(response);
        }
    }
    return deidentifiedItems;
}
exports.deidentifyData = functions.https.onRequest(async (request, response) => {
    const { calls } = request.body;
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
        const bqResponse = {
            replies: await deidentifyWithMask(calls),
        };
        response.send(bqResponse);
    }
    catch (error) {
        functions.logger.error(error);
        response.status(500).send(`errorMessage: ${error}`);
    }
});
function checkNotNull(options) {
    if (options == null) {
        throw new Error("userDefinedContext is required. Found null.");
    }
    return { replies: options };
}
function identifyCallMode(options) {
    var callMode = CALL_MODE_KEY in options ? options[CALL_MODE_KEY] : null;
    if (CALL_MODE_KEY in options) {
        const callModeEnum = callMode;
        return callModeEnum;
    }
    else {
        return call_mode_1.default.DEIDENTIFY;
    }
}
exports.createBigQueryConnection = functions.tasks
    .taskQueue()
    .onDispatch(async (task) => {
    const runtime = (0, extensions_1.getExtensions)().runtime();
    console.log("Task received => ", task);
    const parent = `projects/${config_1.default.projectId}/locations/${config_1.default.location}`;
    const connectionIdPrefix = `ext-bq-dlp-`;
    try {
        const connection1 = await bigqueryConnectionClient.createConnection({
            parent: parent,
            connectionId: `${connectionIdPrefix}deidentify`,
            connection: {
                cloudResource: {
                    serviceAccountId: "ext-bigquery-dlp-function@extensions-testing.iam.gserviceaccount.com",
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
                    serviceAccountId: "ext-bigquery-dlp-function@extensions-testing.iam.gserviceaccount.com",
                },
                name: `${connectionIdPrefix}reidentify`,
                friendlyName: "Reidentify Data",
            },
        });
        functions.logger.info("Connection 1 => ", connection1);
        functions.logger.info("Connection 2 => ", connection2);
        if (connection1 && connection2) {
            const query = `
        BEGIN
          CREATE FUNCTION \`${config_1.default.projectId}.${config_1.default.datasetId}\`.deindetify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config_1.default.projectId}.${config_1.default.location}.${connectionIdPrefix}deidentify\`
          OPTIONS (
            endpoint = 'https://${config_1.default.location}-${config_1.default.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData'
          );
          CREATE FUNCTION \`${config_1.default.projectId}.${config_1.default.datasetId}\`.reindetify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config_1.default.projectId}.${config_1.default.location}.${connectionIdPrefix}reidentify\`
          OPTIONS (
            endpoint = 'https://${config_1.default.location}-${config_1.default.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData'
          );
        END;
         `;
            const options = {
                query: query,
                location: config_1.default.location,
            };
            // Run the query as a job
            const [job] = await bigqueryClient.createQueryJob(options);
            functions.logger.debug(`Job ${job.id} started.`);
            // Wait for the query to finish
            const [rows] = await job.getQueryResults();
            functions.logger.debug("Rows: ", rows);
            await runtime.setProcessingState("PROCESSING_COMPLETE", "Connections created successfully.");
        }
    }
    catch (error) {
        functions.logger.error(error);
        await runtime.setProcessingState("PROCESSING_FAILED", "Connections were not created.");
    }
});
//# sourceMappingURL=index.js.map