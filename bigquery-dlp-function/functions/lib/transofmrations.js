"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadactTransformation = exports.MaskTransformation = void 0;
const config_1 = require("./config");
class Transformation {
    constructor() {
        this.config = {};
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
        const maskingConfig = {
            transformationErrorHandling: {
                throwError: true,
            },
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
        };
        this.config = {
            parent: this.parent,
            reidentifyConfig: maskingConfig,
            deidentifyConfig: maskingConfig,
        };
    }
}
exports.MaskTransformation = MaskTransformation;
class RadactTransformation extends Transformation {
    /**
     * Redacts a value by removing it.
     */
    constructor() {
        super();
        const maskingConfig = {
            transformationErrorHandling: {
                throwError: true,
            },
            infoTypeTransformations: {
                transformations: [
                    {
                        primitiveTransformation: {
                            redactConfig: {},
                        },
                    },
                ],
            },
        };
        this.config = {
            parent: this.parent,
            reidentifyConfig: maskingConfig,
            deidentifyConfig: maskingConfig,
        };
    }
}
exports.RadactTransformation = RadactTransformation;
//# sourceMappingURL=transofmrations.js.map