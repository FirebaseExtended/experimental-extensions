"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const dlp_1 = require("@google-cloud/dlp");
const bigquery_connection_1 = require("@google-cloud/bigquery-connection");
const bigquery_1 = require("@google-cloud/bigquery");
const extensions_1 = require("firebase-admin/extensions");
const config_1 = require("./config");
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
                            },
                        },
                    },
                ],
            },
        },
    };
    for (const row of rows) {
        const data = row[0];
        functions.logger.debug(data);
        const request = Object.assign(Object.assign({}, deidentifyConfig), { item: { value: data }, parent: parent });
        const [response] = await dlp.deidentifyContent(request);
        deidentifiedItems.push((_a = response.item) === null || _a === void 0 ? void 0 : _a.value);
        functions.logger.debug(response.item);
    }
    return deidentifiedItems;
}
exports.deidentifyData = functions.https.onRequest(async (request, response) => {
    const { calls } = request.body;
    functions.logger.debug("Incoming request from BigQuery", calls);
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
                    serviceAccountId: `ext-bigquery-dlp-function@${config_1.default.projectId}.iam.gserviceaccount.com`,
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
        functions.logger.info("Connection 1 created => ", connection1);
        functions.logger.info("Connection 2 created => ", connection2);
        if (connection1 && connection2) {
            const query = `
        BEGIN
          CREATE FUNCTION \`${config_1.default.projectId}.${config_1.default.datasetId}\`.deidentify(data STRING) RETURNS STRING
          REMOTE WITH CONNECTION \`${config_1.default.projectId}.${config_1.default.location}.${connectionIdPrefix}deidentify\`
          OPTIONS (
            endpoint = 'https://${config_1.default.location}-${config_1.default.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData'
          );
          CREATE FUNCTION \`${config_1.default.projectId}.${config_1.default.datasetId}\`.reindetify(data STRING) RETURNS STRING
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