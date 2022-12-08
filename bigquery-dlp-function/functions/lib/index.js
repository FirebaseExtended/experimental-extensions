"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deidentifyData = void 0;
const functions = require("firebase-functions");
const dlp_1 = require("@google-cloud/dlp");
const bigquery_connection_1 = require("@google-cloud/bigquery-connection");
const config_1 = require("./config");
const CALL_MODE_KEY = "mode";
const TRANSFORM_ALGO_KEY = "algo";
// Instantiates a client
const dlp = new dlp_1.default.DlpServiceClient({
    keyFilename: config_1.default.servicePath,
});
const bigqueryClient = new bigquery_connection_1.ConnectionServiceClient({
    keyFilename: config_1.default.servicePath,
});
const parent = `projects/${config_1.default.projectId}/locations/global`;
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
async function deidentifyWithMask(rows) {
    var _a;
    const deidentifiedItems = [];
    for (const row of rows) {
        const request = Object.assign(Object.assign({}, deidentifyConfig), { item: { value: row.value } });
        const [response] = await dlp.deidentifyContent(request);
        deidentifiedItems.push((_a = response.item) === null || _a === void 0 ? void 0 : _a.value);
        console.log(response);
    }
    return deidentifiedItems;
}
exports.deidentifyData = functions.https.onCall(async (data, ctx) => {
    bigqueryClient.createConnection({
        parent: parent,
        connection: { name: "test", cloudResource: {} },
        connectionId: "test",
    });
    const bqrequest = data;
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
        return CallMode.DEIDENTIFY;
    }
}
var CallMode;
(function (CallMode) {
    CallMode["DEIDENTIFY"] = "DEIDENTIFY";
    CallMode["REIDENTIFY"] = "REIDENTIFY";
})(CallMode || (CallMode = {}));
//# sourceMappingURL=index.js.map