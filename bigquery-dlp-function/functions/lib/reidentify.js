"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reidentifyWithInfoTypeTransformations = void 0;
const functions = require("firebase-functions");
const config_1 = require("./config");
async function reidentifyWithInfoTypeTransformations(rows, client) {
    var _a;
    const reidentifiedItems = [];
    const parent = `projects/${config_1.default.projectId}/locations/${config_1.default.location}`;
    const reidentifyConfig = {
        parent: parent,
        reidentifyConfig: {
            transformationErrorHandling: {
                throwError: true,
            },
            infoTypeTransformations: {
                transformations: [
                    {
                        primitiveTransformation: {
                            characterMaskConfig: {},
                        },
                    },
                ],
            },
        },
    };
    for (const row of rows) {
        const data = row[0];
        functions.logger.debug(data);
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                const request = Object.assign(Object.assign({}, reidentifyConfig), { item: { value: element }, parent: parent });
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