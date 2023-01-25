import axios from "axios";

import { secretManager as client } from "./clients";
import config from "./config";

const parent = `projects/${config.gcpProject}`;
const secretId = `ext-${config.extId}-refresh-token`;

export async function createAndAccessSecret(refreshToken: string) {
  const payload = refreshToken;

  // Create the secret with automation replication.
  const [secret] = await client.createSecret({
    parent,
    secret: {
      name: secretId,
      replication: {
        automatic: {},
      },
    },
    secretId,
  });

  console.info(`Created secret ${secret.name}`);

  // Add a version with a payload onto the secret.
  const [version] = await client.addSecretVersion({
    parent: secret.name,
    payload: {
      data: Buffer.from(payload, "utf8"),
    },
  });

  console.info(`Added secret version ${version.name}`);

  // Access the secret.
  const [accessResponse] = await client.accessSecretVersion({
    name: version.name,
  });

  const responsePayload = accessResponse.payload?.data?.toString();
  console.info(`Payload: ${responsePayload}`);
}

export async function getTokenId(
  email: string
): Promise<Record<string, string> | undefined> {
  const target = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token?audience=${email}`;
  const res = axios.post(
    target,
    {},
    { headers: { "Metadata-Flavor": "Google" } }
  );
  const token = (await res).data;
  return token;
}
