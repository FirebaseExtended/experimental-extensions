import * as functions from "firebase-functions";
import { DlpServiceClient, protos } from "@google-cloud/dlp";

import config from "./config";

type ReidentifyRequest = protos.google.privacy.dlp.v2.IReidentifyContentRequest;

export async function reidentifyWithInfoTypeTransformations(
  rows: [],
  client: DlpServiceClient
) {
  const reidentifiedItems = [];

  const parent = `projects/${config.projectId}/locations/${config.location}`;
  const reidentifyConfig: ReidentifyRequest = {
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
    const data = row[0] as Record<string, any>;
    functions.logger.debug(data);

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key];
        const request = {
          ...reidentifyConfig,
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
