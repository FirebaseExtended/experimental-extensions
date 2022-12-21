"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const dlp_1 = require("@google-cloud/dlp");
const bigquery_connection_1 = require("@google-cloud/bigquery-connection");
const bigquery_1 = require("@google-cloud/bigquery");
const extensions_1 = require("firebase-admin/extensions");
const config_1 = require("./config");
const deidentify_1 = require("./deidentify");
admin.initializeApp();
const dlp = new dlp_1.default.DlpServiceClient();
const bigqueryClient = new bigquery_1.BigQuery();
const bigqueryConnectionClient = new bigquery_connection_1.ConnectionServiceClient();
exports.deidentifyData = functions.https.onRequest(async (request, response) => {
    const { calls, userDefinedContext } = request.body;
    functions.logger.debug("Incoming request from BigQuery", calls);
    try {
        if (userDefinedContext.method === "INFO_TYPE") {
            response.send({
                replies: await (0, deidentify_1.deidentifyWithInfoTypeTransformations)(calls, dlp),
            });
        }
        else if (userDefinedContext.method === "RECORD") {
            response.send({
                replies: await (0, deidentify_1.deidentifyWithRecordTransformations)(calls, dlp),
            });
        }
        else {
            response.status(400).send("Invalid method");
        }
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
    const connectionId = `ext-bigquery-dlp-function`;
    try {
        const connection = await bigqueryConnectionClient.createConnection({
            parent: parent,
            connectionId: connectionId,
            connection: {
                cloudResource: {
                    serviceAccountId: `ext-bigquery-dlp-function@${config_1.default.projectId}.iam.gserviceaccount.com`,
                },
                name: connectionId,
                friendlyName: "Deidentify Data",
            },
        });
        functions.logger.info("Connection 1 created => ", connection);
        if (connection) {
            const query = `
        BEGIN
          CREATE FUNCTION \`${config_1.default.projectId}.${config_1.default.datasetId}\`.deidentify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config_1.default.projectId}.${config_1.default.location}.${connectionId}\`
          OPTIONS (
            endpoint = 'https://${config_1.default.location}-${config_1.default.projectId}.cloudfunctions.net/ext-bigquery-dlp-function-deidentifyData',
            user_defined_context = [("method", "${config_1.default.method}")]
          );
          CREATE FUNCTION \`${config_1.default.projectId}.${config_1.default.datasetId}\`.reindetify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config_1.default.projectId}.${config_1.default.location}.${connectionId}\`
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