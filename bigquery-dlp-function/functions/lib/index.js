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
const transofmrations_1 = require("./transofmrations");
const reidentify_1 = require("./reidentify");
admin.initializeApp();
const dlp = new dlp_1.default.DlpServiceClient();
const bigqueryClient = new bigquery_1.BigQuery();
const bigqueryConnectionClient = new bigquery_connection_1.ConnectionServiceClient();
exports.deidentifyData = functions.https.onRequest(async (request, response) => {
    const { calls, userDefinedContext } = request.body;
    functions.logger.debug("Incoming request from BigQuery", calls);
    try {
        if (userDefinedContext.method === "INFO_TYPE") {
            var transformation;
            switch (config_1.default.technique) {
                case "redact":
                    transformation = new transofmrations_1.RedactTransformation();
                    break;
                default:
                    transformation = new transofmrations_1.MaskTransformation();
            }
            response.send({
                replies: await (0, deidentify_1.deidentifyWithInfoTypeTransformations)(calls, dlp, transformation),
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
    }
    catch (error) {
        functions.logger.error(error);
        response.status(500).send(`errorMessage: ${error}`);
    }
});
exports.reidentifyData = functions.https.onRequest(async (request, response) => {
    const { calls, userDefinedContext } = request.body;
    functions.logger.debug("Incoming request from BigQuery", calls);
    try {
        if (userDefinedContext.method === "INFO_TYPE") {
            var transformation;
            switch (config_1.default.technique) {
                default:
                    response.status(400).send("Invalid or irreversable technique");
                    return;
            }
            response.send({
                replies: await (0, reidentify_1.reidentifyWithInfoTypeTransformations)(calls, dlp, transformation),
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
    }
    catch (error) {
        functions.logger.error(error);
        response.status(500).send(`errorMessage: ${error}`);
    }
});
exports.createBigQueryConnection = functions.tasks
    .taskQueue()
    .onDispatch(async () => {
    const runtime = (0, extensions_1.getExtensions)().runtime();
    const parent = `projects/${config_1.default.projectId}/locations/${config_1.default.location}`;
    const instanceId = "ext-" + config_1.default.extInstanceId;
    var connection;
    try {
        connection = await bigqueryConnectionClient.createConnection({
            parent: parent,
            connectionId: instanceId,
            connection: {
                cloudResource: {
                    serviceAccountId: `${instanceId}@${config_1.default.projectId}.iam.gserviceaccount.com`,
                },
                name: instanceId,
                friendlyName: "DLP Extension",
            },
        });
        functions.logger.info("Connection successfully created 🎉", connection);
    }
    catch (error) {
        if (error["code"] === 6) {
            functions.logger.info(`Connection ${instanceId} already exists, will continue creating functions`);
        }
        else {
            functions.logger.error(error);
            await runtime.setProcessingState("PROCESSING_FAILED", "Error creating connection. Check logs for more details.");
            return;
        }
    }
    try {
        const query = `
        BEGIN
          CREATE FUNCTION \`${config_1.default.projectId}.${config_1.default.datasetId}\`.deidentify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config_1.default.projectId}.${config_1.default.location}.${instanceId}\`
          OPTIONS (
            endpoint = 'https://${config_1.default.location}-${config_1.default.projectId}.cloudfunctions.net/${instanceId}-deidentifyData',
            user_defined_context = [("method", "${config_1.default.method}"), ("technique", "${config_1.default.technique}")]
          );
          CREATE FUNCTION \`${config_1.default.projectId}.${config_1.default.datasetId}\`.reidentify(data JSON) RETURNS JSON
          REMOTE WITH CONNECTION \`${config_1.default.projectId}.${config_1.default.location}.${instanceId}\`
          OPTIONS (
            endpoint = 'https://${config_1.default.location}-${config_1.default.projectId}.cloudfunctions.net/${instanceId}-reidentifyData',
            user_defined_context = [("method", "${config_1.default.method}"), ("technique", "${config_1.default.technique}")]
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
        await job.getQueryResults();
        await runtime.setProcessingState("PROCESSING_COMPLETE", "Connections created successfully.");
    }
    catch (error) {
        functions.logger.error(error);
        await runtime.setProcessingState("PROCESSING_FAILED", "Connections were not created.");
    }
});
//# sourceMappingURL=index.js.map