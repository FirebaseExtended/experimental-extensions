import { datastore, gmail, googleSheets, vision } from "./clients";
import { Message } from "./types/message";
import config from "./config";

const SHEET_RANGE = "Sheet1!A1:F1";

export async function checkForDuplicateNotifications(messageId: string) {
  const transaction = datastore.transaction();
  await transaction.run();

  const messageKey = datastore.key(["emailNotifications", messageId]);
  const [message] = await transaction.get(messageKey);

  if (!message) {
    await transaction.save({
      key: messageKey,
      data: {},
    });

    return;
  }

  await transaction.commit();
  if (!message) {
    return messageId;
  }

  return;
}

/**
 * Get the most recent message with the tag.
 *
 * @param email
 * @param historyId
 * @returns
 */
export async function getMostRecentMessageWithTag(
  email: string,
  historyId: string
) {
  // Look up the most recent message.
  const listMessagesRes = await gmail.users.messages.list({
    userId: email,
    maxResults: 1,
  });

  if (!listMessagesRes.data.messages) {
    return;
  }

  const firstMessageId = listMessagesRes.data.messages[0].id!;
  const messageId = await checkForDuplicateNotifications(firstMessageId);

  // Get the message using the message ID.
  if (messageId) {
    const message = await gmail.users.messages.get({
      userId: email,
      id: messageId,
    });

    return message;
  }
}

/**
 * Extract message ID, sender, attachment filename and attachment ID
 * from the message.
 *
 * @param {pubsub.Message} message PubSub message object.
 * @returns {Message} Message object with message ID, sender, attachment filename and attachment ID.
 */
export function extractInfoFromMessage(message: Message) {
  const messageId = message.data.id;
  let from;
  let filename;
  let attachmentId;

  const headers = message.data.payload?.headers;
  if (!headers) {
    return;
  }

  for (var h of headers) {
    if (h.name === "From") {
      from = h.value;
    }
  }

  const payloadParts = message.data.payload?.parts;
  if (!payloadParts) {
    return;
  }

  for (var p of payloadParts) {
    if (p.body?.attachmentId) {
      filename = p.filename;
      attachmentId = p.body.attachmentId;
    }
  }

  return {
    messageId: messageId,
    from: from,
    attachmentFilename: filename,
    attachmentId: attachmentId,
  };
}

/**
 * Get the attachment from the message.
 *
 * @param {string} email The email address of the user.
 * @param {string} messageId The ID of the message.
 * @param {string} attachmentId The ID of the attachment.
 * @returns
 */
export async function extractAttachmentFromMessage(
  email: string,
  messageId: string,
  attachmentId: string
) {
  return gmail.users.messages.attachments.get({
    id: attachmentId,
    messageId: messageId,
    userId: email,
  });
}

/**
 * Tag the attachment using Cloud Vision API.
 *
 * @param data
 * @param filename
 * @returns
 */
export async function analyzeAttachment(data: string, filename: string) {
  const topLabels: Array<string> = [];
  if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
    const [analysis] = await vision.labelDetection({
      image: {
        content: Buffer.from(data, "base64"),
      },
    });

    const labels = analysis.labelAnnotations;
    if (labels) {
      for (const label of labels) {
        if (label.description) topLabels.push(label.description);
      }
    }
  }

  return topLabels;
}

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
  topLabels: Array<string>
) {
  await googleSheets.spreadsheets.values.append({
    spreadsheetId: config.sheetId,
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      range: SHEET_RANGE,
      majorDimension: "ROWS",
      values: [[from, filename].concat(topLabels)],
    },
  });
}
