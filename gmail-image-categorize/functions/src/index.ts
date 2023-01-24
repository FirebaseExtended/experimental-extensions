import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { getExtensions } from "firebase-admin/extensions";
import { setSubscriptionPolicy } from "./pubsub";
import { google } from "googleapis";

import { authInit, authCallback, authGmail, authedUser } from "./auth";
import {
  analyzeAttachment,
  extractAttachmentFromMessage,
  extractInfoFromMessage,
  getMostRecentMessageWithTag,
  updateReferenceSheet,
} from "./gmail";
import { Message } from "./types/message";

import config from "./config";

admin.initializeApp();

// In older versions of the functions runtime, the `FUNCTION_TRIGGER_TYPE`
// were set, but not `FUNCTION_SIGNATURE_TYPE`. In newer versions,
// only `FUNCTION_SIGNATURE_TYPE` is set.
// Both declare the type of the trigger, but the `express-oauth2-handler` library
// uses `FUNCTION_TRIGGER_TYPE`, so we're setting it explicitly.
const triggerType = process.env.FUNCTION_SIGNATURE_TYPE;
process.env.FUNCTION_TRIGGER_TYPE = triggerType;

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
    functions.logger.info(process.env.FUNCTION_TRIGGER_TYPE);
    functions.logger.info(process.env.FUNCTION_SIGNATURE_TYPE);

    // Decode the incoming Gmail push notification.
    const data = Buffer.from(message.data, "base64").toString();
    const newMessageNotification = JSON.parse(data);
    const email = newMessageNotification.emailAddress;
    const historyId = newMessageNotification.historyId;

    // Ensure the user is authenticated.
    try {
      await authGmail.auth.requireAuth(null, null, email);
    } catch (err) {
      functions.logger.error("An error has occurred in the auth process.", err);
      throw err;
    }

    const authClient = await authedUser.getClient();
    google.options({ auth: authClient });

    // Process the incoming message.
    const messageData: Message | undefined = await getMostRecentMessageWithTag(
      email,
      historyId
    );
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
          messageInfo.attachmentId
        );
        const topLabels = await analyzeAttachment(
          attachment.data.data!,
          messageInfo.attachmentFilename
        );
        if (topLabels !== null && topLabels.length > 0) {
          await updateReferenceSheet(
            messageInfo.from!,
            messageInfo.attachmentFilename,
            topLabels
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
      await setSubscriptionPolicy();
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
