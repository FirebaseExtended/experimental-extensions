import config from "./config";
import { protos } from "@google-cloud/dlp";

type ReidentifyRequest = protos.google.privacy.dlp.v2.IReidentifyContentRequest;
type DeidentifyRequest = protos.google.privacy.dlp.v2.IDeidentifyContentRequest;
type FieldId = protos.google.privacy.dlp.v2.FieldId;
type Row = protos.google.privacy.dlp.v2.Table.Row;
type Table = protos.google.privacy.dlp.v2.ITable | undefined | null;

class Transformation {
  parent: string;
  deidentifyConfig: DeidentifyRequest = {};
  reidentifyConfig: ReidentifyRequest = {};

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
      ...(config.method == "INFO_TYPE" && {
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
      }),
      ...(config.method == "RECORD" && {
        recordTransformations: {
          fieldTransformations: [
            {
              fields: getFieldIds(),
              primitiveTransformation: {
                characterMaskConfig: {
                  maskingCharacter: mask ?? "x",
                  numberToMask: numberToMask ?? 5,
                },
              },
            },
          ],
        },
      }),
    };

    this.deidentifyConfig = {
      parent: this.parent,
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
    const redactConfig = {
      ...(config.method == "INFO_TYPE" && {
        infoTypeTransformations: {
          transformations: [
            {
              primitiveTransformation: {
                redactConfig: {},
              },
            },
          ],
        },
      }),
      ...(config.method == "RECORD" && {
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
      }),
    };

    this.deidentifyConfig = {
      parent: this.parent,
      deidentifyConfig: redactConfig,
    };
  }
}

export function rowsToTable(rows: []) {
  let table = {
    headers: [] as FieldId[],
    rows: [] as Row[],
  };

  for (const row of rows) {
    const data = row[0] as Record<string, any>;

    const keys = Object.keys(data);
    const values = Object.values(data);

    if (table.headers.length === 0) {
      // Add headers only once
      table.headers = keys.map((key) => {
        const field = protos.google.privacy.dlp.v2.FieldId.create({
          name: key,
        });
        return field;
      });
    }

    const tableRow = protos.google.privacy.dlp.v2.Table.Row.create({
      values: values.map((v) => {
        const field = protos.google.privacy.dlp.v2.Value.create({
          stringValue: v,
        });
        return field;
      }),
    });

    table.rows.push(tableRow);
  }

  return table;
}

export function getFieldIds() {
  const fields = config.fields?.split(",");
  const fieldIds = fields?.map((field) => {
    return { name: field };
  });
  return fieldIds;
}

export function tableToReplies(table: Table) {
  const replies = [];
  const rows = table?.rows?.map((row) =>
    row.values?.map((value) => value.stringValue)
  );

  if (!rows || !table || !table.headers) return [];

  for (const row of rows) {
    const reply = {} as Record<string, any>;

    for (let i = 0; i < table.headers.length; i++) {
      const header = table.headers[i].name as string;
      reply[header] = row![i];
    }

    replies.push(reply);
  }

  return replies;
}
