"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deidentifyWithInfoTypeTransformations = void 0;
const functions = require("firebase-functions");
// The maximum number of days to shift a date backward
const lowerBoundDays = 1;
// The maximum number of days to shift a date forward
const upperBoundDays = 1;
function rowsToTable(rows) {
    // Helper function for converting rows to Protobuf types
    const rowToProto = (row) => {
        const values = row.split(",");
        const convertedValues = values.map((value) => {
            if (Date.parse(value)) {
                const date = new Date(value);
                return {
                    dateValue: {
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        day: date.getDate(),
                    },
                };
            }
            else {
                // Convert all non-date values to strings
                return { stringValue: value.toString() };
            }
        });
        return { values: convertedValues };
    };
    // Construct the table object
    const table = {
        headers: [],
        rows: rows.map((row) => rowToProto(row[0])),
    };
    return table;
}
/**
 * Deidentify sensitive data in a string with [the Data Loss Prevention API](https://cloud.google.com/architecture/de-identification-re-identification-pii-using-cloud-dlp)
 * using `infoTypeTransformations` method.
 *
 * Read more about this method: https://cloud.google.com/dlp/docs/deidentify-sensitive-data#infotype_transformations
 *
 * @param {string} text The text to deidentify.
 *
 * @returns {string} The deidentified text.
 */
async function deidentifyWithInfoTypeTransformations(rows, client, transformation) {
    var _a;
    const deidentifiedItems = [];
    for (const row of rows) {
        const data = row[0];
        functions.logger.debug(data);
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                const request = Object.assign(Object.assign({}, transformation.deidentifyConfig), { item: { value: element } });
                const [response] = await client.deidentifyContent(request);
                data[key] = (_a = response.item) === null || _a === void 0 ? void 0 : _a.value;
            }
        }
        functions.logger.debug(data);
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
 * @returns {string} The deidentified text.
 */
// export async function deidentifyWithRecordTransformations(
//   rows: any,
//   client: DlpServiceClient,
//   mask?: string,
//   numberToMask?: number
// ) {
//   const parent = `projects/${config.projectId}/locations/${config.location}`;
//   // Construct DateShiftConfig
//   const dateShiftConfig = {
//     lowerBoundDays: lowerBoundDays,
//     upperBoundDays: upperBoundDays,
//   };
//   // Construct de-identification request
//   const request: DeidentifyRequest = {
//     parent: parent,
//     deidentifyConfig: {
//       recordTransformations: {
//         fieldTransformations: [
//           {
//             primitiveTransformation: {
//               dateShiftConfig: dateShiftConfig,
//               characterMaskConfig: {
//                 maskingCharacter: mask ?? "x",
//                 numberToMask: numberToMask ?? 5,
//               },
//             },
//           },
//         ],
//       },
//     },
//     item: {
//       table: rowsToTable(rows),
//     },
//   };
//   // Run deidentification request
//   const [response] = await client.deidentifyContent(request);
//   const tableRows = response.item?.table?.rows;
//   return tableRows;
// }
//# sourceMappingURL=deidentify.js.map