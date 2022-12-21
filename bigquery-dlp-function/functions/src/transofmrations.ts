import config from "./config";
import { protos } from "@google-cloud/dlp";

type ReidentifyRequest = protos.google.privacy.dlp.v2.IReidentifyContentRequest;
type DeidentifyRequest = protos.google.privacy.dlp.v2.IDeidentifyContentRequest;

class Transformation {
  parent: string;
  config: DeidentifyRequest | ReidentifyRequest = {};

  constructor() {
    this.parent = `projects/${config.projectId}/locations/${config.location}`;
  }
}

export class MaskTransformation extends Transformation {
  /**
   * Replace a value by a mask character.
   *
   * @param mask The character to mask the sensitive data with. If not supplied, defaults to `x`.
   * @param numberToMask The number of characters to mask. If not supplied, defaults to `5`.
   */
  constructor(mask?: string, numberToMask?: number) {
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
                maskingCharacter: mask ?? "x",
                numberToMask: numberToMask ?? 5,
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

export class RedactTransformation extends Transformation {
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
