import { ImageAnnotatorClient } from "@google-cloud/vision";
import { Datastore } from "@google-cloud/datastore";
import { google } from "googleapis";

export const googleSheets = google.sheets("v4");
export const gmail = google.gmail("v1");
export const datastore = new Datastore();
export const vision = new ImageAnnotatorClient();
