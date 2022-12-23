"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reidentifyWithInfoTypeTransformations = void 0;
const functions = require("firebase-functions");
const transofmrations_1 = require("./transofmrations");
const config_1 = require("./config");
async function reidentifyWithInfoTypeTransformations(rows, client, transformation) {
    var _a;
    const reidentifiedItems = [];
    const parent = `projects/${config_1.default.projectId}/locations/${config_1.default.location}`;
    if (transformation instanceof transofmrations_1.MaskTransformation) {
        functions.logger.debug("Mask Transformation is irreversable");
        throw new Error("Mask Transformation is irreversable");
    }
    for (const row of rows) {
        const data = row[0];
        functions.logger.debug(data);
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                const request = Object.assign(Object.assign({}, transformation.reidentifyConfig), { item: { value: element }, parent: parent });
                const [response] = await client.deidentifyContent(request);
                data[key] = (_a = response.item) === null || _a === void 0 ? void 0 : _a.value;
            }
        }
        functions.logger.debug(data);
        reidentifiedItems.push(data);
    }
    return reidentifiedItems;
}
exports.reidentifyWithInfoTypeTransformations = reidentifyWithInfoTypeTransformations;
//# sourceMappingURL=reidentify.js.map