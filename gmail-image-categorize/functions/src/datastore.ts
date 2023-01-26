import { Credentials } from "google-auth-library";
import { datastore } from "./clients";

export const tokenStorageKind = "oauth2token";
export const sheetStorageKind = "ext-" + process.env.EXT_INSTANCE_ID + "-sheet";
export const emailNotificationKind =
  "ext-" + process.env.EXT_INSTANCE_ID + "-emails";

export async function saveTokenToDatastore(creds: Credentials, email: string) {
  return datastore.save({
    key: datastore.key([tokenStorageKind, email]),
    data: {
      ...creds,
    },
  });
}

export async function saveSheetToDatastore(
  sheetUrl: string,
  sheetId: string,
  email: string
) {
  return datastore.save({
    key: datastore.key([sheetStorageKind, email]),
    data: {
      sheetUrl,
      sheetId,
    },
  });
}

export async function getSheetFromDatastore(
  email: string
): Promise<{ sheetId: string; sheetUrl: string }> {
  const res = await datastore.get(datastore.key([sheetStorageKind, email]));
  return res[0];
}

export async function getTokenFromDatastore(
  email: string
): Promise<Credentials> {
  const res = await datastore.get(datastore.key([tokenStorageKind, email]));
  return res[0];
}
