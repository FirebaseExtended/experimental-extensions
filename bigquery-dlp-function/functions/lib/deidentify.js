"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deidentifyWithRecordTransformations = exports.deidentifyWithInfoTypeTransformations = void 0;
const functions = require("firebase-functions");
const transofmrations_1 = require("./transofmrations");
/**
 * Deidentify sensitive data in a string with [the Data Loss Prevention API](https://cloud.google.com/architecture/de-identification-re-identification-pii-using-cloud-dlp)
 * using `infoTypeTransformations` method.
 *
 * Read more about this method: https://cloud.google.com/dlp/docs/deidentify-sensitive-data#infotype_transformations
 *
 * @param {string} text The text to deidentify.
 *
 * @returns {Promise<Record<string, any>>} The deidentified record.
 */
async function deidentifyWithInfoTypeTransformations(rows, client, transformation) {
    var _a;
    const deidentifiedItems = [];
    for (const row of rows) {
        const data = row[0];
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                const request = Object.assign(Object.assign({}, transformation.deidentifyConfig), { item: { value: element } });
                const [response] = await client.deidentifyContent(request);
                data[key] = (_a = response.item) === null || _a === void 0 ? void 0 : _a.value;
            }
        }
        deidentifiedItems.push(data);
    }
    return deidentifiedItems;
}
exports.deidentifyWithInfoTypeTransformations = deidentifyWithInfoTypeTransformations;
/**
 * Deidentify sensitive data in a string with the [Data Loss Prevention API](https://cloud.google.com/architecture/de-identification-re-identification-pii-using-cloud-dlp)
 * using `recordTransformations` method.
 *
 * Read more about this method: https://cloud.google.com/dlp/docs/deidentify-sensitive-data#record_transformations
 *
 * @param {string} text The text to deidentify.
 *
 * @returns {Promise<string>} The deidentified text.
 */
async function deidentifyWithRecordTransformations(rows, client, transformation) {
    var _a, _b;
    let table;
    try {
        // Convert raw rows to Table type
        table = (0, transofmrations_1.rowsToTable)(rows);
    }
    catch (error) {
        functions.logger.debug(`Error converting rows to Table type.`);
        throw error;
    }
    // Construct de-identification request
    const request = Object.assign(Object.assign({}, transformation.deidentifyConfig), { item: {
            table: table,
        } });
    // Run deidentification request
    const [response] = await client.deidentifyContent(request);
    functions.logger.debug((0, transofmrations_1.tableToReplies)((_a = response.item) === null || _a === void 0 ? void 0 : _a.table));
    return (0, transofmrations_1.tableToReplies)((_b = response.item) === null || _b === void 0 ? void 0 : _b.table);
}
exports.deidentifyWithRecordTransformations = deidentifyWithRecordTransformations;
//# sourceMappingURL=deidentify.js.map