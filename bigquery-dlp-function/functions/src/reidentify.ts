import * as functions from "firebase-functions";
import { DlpServiceClient } from "@google-cloud/dlp";

import { MaskTransformation, RedactTransformation } from "./transofmrations";
import config from "./config";

export async function reidentifyWithInfoTypeTransformations(
  rows: [],
  client: DlpServiceClient,
  transformation: MaskTransformation | RedactTransformation
) {
  const reidentifiedItems = [];

  const parent = `projects/${config.projectId}/locations/${config.location}`;

  if (transformation instanceof MaskTransformation) {
    functions.logger.debug("Mask Transformation is irreversable");
    throw new Error("Mask Transformation is irreversable");
  }

  for (const row of rows) {
    const data = row[0] as Record<string, any>;
    functions.logger.debug(data);

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key];
        const request = {
          ...transformation.reidentifyConfig,
          item: { value: element },
          parent: parent,
        };

        const [response] = await client.deidentifyContent(request);
        data[key] = response.item?.value;
      }
    }

    functions.logger.debug(data);
    reidentifiedItems.push(data);
  }

  return reidentifiedItems;
}
