import { ImageAnnotatorClient } from "@google-cloud/vision";
import { Datastore } from "@google-cloud/datastore";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

export const gmail = google.gmail("v1");
export const datastore = new Datastore();
export const vision = new ImageAnnotatorClient();
export const secretManager = new SecretManagerServiceClient();

export const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);
