import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { getExtensions } from "firebase-admin/extensions";
import { setTopicPolicy as setTopicPolicy } from "./pubsub";
import { google, sheets_v4 } from "googleapis";

import { authInit, authCallback } from "./auth";
import {
  analyzeAttachment,
  extractAttachmentFromMessage,
  extractInfoFromMessage,
  getMostRecentMessageWithTag,
} from "./gmail";

import { getSheetFromDatastore, getTokenFromDatastore } from "./datastore";
import { getTokenId } from "./secrets";
import { oAuth2Client } from "./clients";
import config from "./config";

admin.initializeApp();

export const initializeAuth = functions.https.onRequest(async (req, res) => {
  try {
    functions.logger.info("Auth initialized.");
    await authInit(req, res);
  } catch (error) {
    functions.logger.error(error);
  }
});

export const callback = functions.https.onRequest(async (req, res) => {
  try {
    return authCallback(req, res);
  } catch (error) {
    functions.logger.error(error);
  }
});

export const watchGmailMessages = functions.pubsub
  .topic(config.pubsubTopic)
  .onPublish(async (message) => {
    // Decode the incoming Gmail push notification.
    const data = Buffer.from(message.data, "base64").toString();
    const newMessageNotification = JSON.parse(data);
    const email = newMessageNotification.emailAddress;
    const historyId = newMessageNotification.historyId;

    try {
      const tokens = await getTokenFromDatastore(email);
      oAuth2Client.setCredentials(tokens!);
      functions.logger.info("🔑 Tokens fetched.", oAuth2Client);
    } catch (err) {
      functions.logger.error("An error has occurred in the auth process.", err);
      return;
    }

    const gmail = google.gmail({
      version: "v1",
      auth: oAuth2Client,
    });

    // Process the incoming message.
    const messageData = await getMostRecentMessageWithTag(
      email,
      historyId,
      gmail
    );

    functions.logger.info("📬 New message received.", messageData);

    if (messageData) {
      const messageInfo = extractInfoFromMessage(messageData);

      if (
        messageInfo &&
        messageInfo.attachmentId &&
        messageInfo.attachmentFilename
      ) {
        const attachment = await extractAttachmentFromMessage(
          email,
          messageInfo.messageId!,
          messageInfo.attachmentId,
          gmail
        );

        const topLabels = await analyzeAttachment(
          attachment.data.data!,
          messageInfo.attachmentFilename
        );

        if (topLabels !== null && topLabels.length > 0) {
          const sheet = await getSheetFromDatastore(email);

          await updateReferenceSheet(
            messageInfo.from!,
            messageInfo.attachmentFilename,
            topLabels,
            sheet.sheetId,
            google.sheets({ version: "v4", auth: oAuth2Client })
          );
        }
      }
    }
  });

export const setIamPolicy = functions.tasks
  .taskQueue()
  .onDispatch(async (data) => {
    const runtime = getExtensions().runtime();

    try {
      await setTopicPolicy();

      await runtime.setProcessingState(
        "PROCESSING_COMPLETE",
        `Completed setting IAM policy for topic ${config.pubsubTopic}.`
      );
    } catch (error) {
      functions.logger.error(error);
      return await runtime.setProcessingState(
        "PROCESSING_FAILED",
        `Check logs for more info.`
      );
    }
  });

/**
 * Write sender, attachment filename, and download link to a Google Sheet.
 *
 * @param {string} from
 * @param {string} filename
 * @param {string[]} topLabels
 */
export async function updateReferenceSheet(
  from: string,
  filename: string,
  topLabels: Array<string>,
  sheetId: string,
  client: sheets_v4.Sheets
) {
  const SHEET_RANGE = "Sheet1!A1:F1";
  await client.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      range: SHEET_RANGE,
      majorDimension: "ROWS",
      values: [[from, filename].concat(topLabels)],
    },
  });
}
