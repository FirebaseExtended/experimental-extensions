import { datastore, vision } from "./clients";
import { Message } from "./types/message";
import { gmail_v1 } from "googleapis";
import { emailNotificationKind } from "./datastore";

export async function checkForDuplicateNotifications(messageId: string) {
  const transaction = datastore.transaction();
  await transaction.run();

  const messageKey = datastore.key([emailNotificationKind, messageId]);
  const [message] = await transaction.get(messageKey);

  console.log("Message to store", message);

  if (!message) {
    console.log("Saving message...", message);

    await transaction.save({
      key: messageKey,
      data: {},
    });
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
  historyId: string,
  client: gmail_v1.Gmail
) {
  // Look up the most recent message.
  const listMessagesRes = await client.users.messages.list({
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
    const message = await client.users.messages.get({
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
  attachmentId: string,
  client: gmail_v1.Gmail
) {
  return client.users.messages.attachments.get({
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
