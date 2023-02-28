"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableToReplies = exports.rowsToTable = exports.ReplaceWithInfoTypeTransformation = exports.ReplaceTransformation = exports.RedactTransformation = exports.MaskTransformation = void 0;
const config_1 = require("./config");
const dlp_1 = require("@google-cloud/dlp");
class Transformation {
    constructor() {
        this.deidentifyConfig = {};
        this.reidentifyConfig = {};
        this.parent = `projects/${config_1.default.projectId}/locations/${config_1.default.location}`;
    }
}
class MaskTransformation extends Transformation {
    /**
     * Replace a value by a mask character.
     *
     * @param mask The character to mask the sensitive data with. If not supplied, defaults to `x`.
     * @param numberToMask The number of characters to mask. If not supplied, defaults to `5`.
     */
    constructor(mask, numberToMask) {
        super();
        const maskingConfig = Object.assign(Object.assign({}, (config_1.default.method == "INFO_TYPE" && {
            infoTypeTransformations: {
                transformations: [
                    {
                        primitiveTransformation: {
                            characterMaskConfig: {
                                maskingCharacter: mask !== null && mask !== void 0 ? mask : "x",
                                numberToMask: numberToMask !== null && numberToMask !== void 0 ? numberToMask : 5,
                            },
                        },
                    },
                ],
            },
        })), (config_1.default.method == "RECORD" && {
            recordTransformations: {
                fieldTransformations: [
                    {
                        fields: getFieldIds(),
                        primitiveTransformation: {
                            characterMaskConfig: {
                                maskingCharacter: mask !== null && mask !== void 0 ? mask : "x",
                                numberToMask: numberToMask !== null && numberToMask !== void 0 ? numberToMask : 5,
                            },
                        },
                    },
                ],
            },
        }));
        this.deidentifyConfig = {
            parent: this.parent,
            deidentifyConfig: maskingConfig,
        };
    }
}
exports.MaskTransformation = MaskTransformation;
class RedactTransformation extends Transformation {
    /**
     * Redacts a value by removing it.
     */
    constructor() {
        super();
        const redactConfig = Object.assign(Object.assign({}, (config_1.default.method == "INFO_TYPE" && {
            infoTypeTransformations: {
                transformations: [
                    {
                        primitiveTransformation: {
                            redactConfig: {},
                        },
                    },
                ],
            },
        })), (config_1.default.method == "RECORD" && {
            recordTransformations: {
                fieldTransformations: [
                    {
                        fields: getFieldIds(),
                        primitiveTransformation: {
                            redactConfig: {},
                        },
                    },
                ],
            },
        }));
        this.deidentifyConfig = {
            parent: this.parent,
            deidentifyConfig: redactConfig,
        };
    }
}
exports.RedactTransformation = RedactTransformation;
class ReplaceTransformation extends Transformation {
    /**
     * Replace with a specified value.
     */
    constructor() {
        super();
        const _replaceConfig = {
            newValue: {
                // TODO make configurable?
                stringValue: "REPLACED",
            },
        };
        const replaceConfig = Object.assign(Object.assign({}, (config_1.default.method == "INFO_TYPE" && {
            infoTypeTransformations: {
                transformations: [
                    {
                        primitiveTransformation: {
                            replaceConfig: _replaceConfig,
                        },
                    },
                ],
            },
        })), (config_1.default.method == "RECORD" && {
            recordTransformations: {
                fieldTransformations: [
                    {
                        fields: getFieldIds(),
                        primitiveTransformation: {
                            replaceConfig: _replaceConfig,
                        },
                    },
                ],
            },
        }));
        this.deidentifyConfig = {
            parent: this.parent,
            deidentifyConfig: replaceConfig,
        };
    }
}
exports.ReplaceTransformation = ReplaceTransformation;
class ReplaceWithInfoTypeTransformation extends Transformation {
    /**
     * Replace with a specified value.
     */
    constructor() {
        super();
        const _replaceConfig = {
            // TODO make configurable?
            partToExtract: "MONTH",
        };
        const replaceConfig = Object.assign(Object.assign({}, (config_1.default.method == "INFO_TYPE" && {
            infoTypeTransformations: {
                transformations: [
                    {
                        primitiveTransformation: {
                            replaceWithInfoTypeConfig: _replaceConfig,
                        },
                    },
                ],
            },
        })), (config_1.default.method == "RECORD" && {
            recordTransformations: {
                fieldTransformations: [
                    {
                        fields: getFieldIds(),
                        primitiveTransformation: {
                            replaceWithInfoTypeConfig: _replaceConfig,
                        },
                    },
                ],
            },
        }));
        this.deidentifyConfig = {
            parent: this.parent,
            deidentifyConfig: replaceConfig,
        };
    }
}
exports.ReplaceWithInfoTypeTransformation = ReplaceWithInfoTypeTransformation;
function rowsToTable(rows) {
    let table = {
        headers: [],
        rows: [],
    };
    for (const row of rows) {
        const data = row[0];
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (table.headers.length === 0) {
            // Add headers only once
            table.headers = keys.map((key) => {
                const field = dlp_1.protos.google.privacy.dlp.v2.FieldId.create({
                    name: key,
                });
                return field;
            });
        }
        const tableRow = dlp_1.protos.google.privacy.dlp.v2.Table.Row.create({
            values: values.map((v) => {
                const field = dlp_1.protos.google.privacy.dlp.v2.Value.create({
                    stringValue: v,
                });
                return field;
            }),
        });
        table.rows.push(tableRow);
    }
    return table;
}
exports.rowsToTable = rowsToTable;
function getFieldIds() {
    var _a;
    const fields = (_a = config_1.default.fields) === null || _a === void 0 ? void 0 : _a.split(",");
    const fieldIds = fields === null || fields === void 0 ? void 0 : fields.map((field) => {
        return { name: field };
    });
    return fieldIds;
}
function tableToReplies(table) {
    var _a;
    const replies = [];
    const rows = (_a = table === null || table === void 0 ? void 0 : table.rows) === null || _a === void 0 ? void 0 : _a.map((row) => { var _a; return (_a = row.values) === null || _a === void 0 ? void 0 : _a.map((value) => value.stringValue); });
    if (!rows || !table || !table.headers)
        return [];
    for (const row of rows) {
        const reply = {};
        for (let i = 0; i < table.headers.length; i++) {
            const header = table.headers[i].name;
            reply[header] = row[i];
        }
        replies.push(reply);
    }
    return replies;
}
exports.tableToReplies = tableToReplies;
//# sourceMappingURL=transofmrations.js.map