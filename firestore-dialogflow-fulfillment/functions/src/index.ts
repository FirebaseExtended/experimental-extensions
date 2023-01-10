/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { WebhookClient } from "dialogflow-fulfillment-helper";
import { HttpsError } from "firebase-functions/v1/auth";
import DialogFlow from "@google-cloud/dialogflow";
import { calendar_v3, google } from "googleapis";
import { GaxiosError } from "gaxios";
import { getExtensions } from "firebase-admin/extensions";

import config from "./config";
import Status from "./types/status";
import Conversation from "./types/conversation";
import { extratDate, getDateTimeFormatted } from "./util";

admin.initializeApp();

const dialogflow = DialogFlow.v2beta1;

async function createCalendarEvent(dateTime: Date) {
  functions.logger.info(
    "Authenticating with Google Calendar API for project: " + config.projectId
  );
  const auth = new google.auth.GoogleAuth({
    projectId: config.projectId,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  const client = await auth.getClient();

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  var dateTimeEnd = new Date(
    dateTime.getTime() + config.defaultDuration * 60000
  );

  const event: calendar_v3.Schema$Event = {
    summary: "Meeting by DialogFlow",
    description: "This is a meeting created by DialogFlow",
    start: {
      dateTime: dateTime.toISOString(),
      timeZone: config.timeZone,
    },
    end: {
      dateTime: dateTimeEnd.toISOString(),
      timeZone: config.timeZone,
    },
    attendees: [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };

  try {
    functions.logger.info("Inserting a new event for: " + config.projectId);

    await calendar.events.insert({
      requestBody: event,
      calendarId: process.env.CALENDAR_ID,
    });
  } catch (error) {
    if (
      error instanceof GaxiosError &&
      error.code &&
      parseInt(error.code) === 404
    ) {
      throw new HttpsError("not-found", "Calendar not found");
    } else {
      functions.logger.error(error);
      throw error;
    }
  }
}

exports.newConversation = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { uid } = ctx.auth;
  const { message } = data;

  if (!message) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a message."
    );
  }

  const ref = admin.firestore().collection("conversations").doc();

  const batch = admin.firestore().bulkWriter();

  batch.create(ref, {
    users: [uid],
    started_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
    message_count: 0,
  });

  batch.create(ref.collection("messages").doc(), {
    type: "USER",
    uid: uid,
    created_at: FieldValue.serverTimestamp(),
    message,
  });

  await batch.close();

  return ref.id;
});

exports.newMessage = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { uid } = ctx.auth;
  const { conversationId, message } = data;

  if (!conversationId || !message) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a conversationId and message."
    );
  }

  const ref = admin.firestore().collection("conversations").doc(conversationId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new HttpsError("not-found", "The conversation does not exist.");
  }

  const { users } = snapshot.data() as Conversation;

  if (!users.includes(uid)) {
    throw new HttpsError(
      "permission-denied",
      "The user is not part of the conversation."
    );
  }

  await ref.collection("messages").doc().create({
    type: "USER",
    status: Status.PENDING,
    uid: uid,
    created_at: FieldValue.serverTimestamp(),
    message,
  });
});

exports.onNewMessage = functions.firestore
  .document("conversations/{conversationId}/{messageCollectionId}/{messageId}")
  .onCreate(async (change, ctx) => {
    const { conversationId } = ctx.params;
    const { type, message, uid } = change.data() as any; // TODO: add types
    const ref = admin
      .firestore()
      .collection("conversations")
      .doc(conversationId);
    let finalized = false;

    await ref.update({
      updated_at: FieldValue.serverTimestamp(),
      message_count: FieldValue.increment(1),
    });

    const auth = new google.auth.GoogleAuth({
      projectId: config.projectId,
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/dialogflow",
      ],
    });

    if (type === "USER") {
      const sessionClient = new dialogflow.SessionsClient({
        auth: auth,
      });

      const sessionPath = sessionClient.projectAgentSessionPath(
        config.projectId,
        conversationId
      );

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            languageCode: config.langugageCode,
            text: message,
          },
        },
        queryParams: {
          timeZone: config.timeZone,
          uid: uid,
        },
      };

      try {
        var [intent] = await sessionClient.detectIntent(request);

        const batch = admin.firestore().bulkWriter();

        batch.update(change.ref, {
          status: Status.SUCCESS,
        });

        if (intent.queryResult?.fulfillmentText) {
          batch.create(ref.collection("messages").doc(), {
            type: "BOT",
            status: Status.SUCCESS,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            message: intent.queryResult.fulfillmentText,
          });

          if (intent.queryResult.intent?.displayName === "intent.calendar") {
            finalized = true;
          }
        } else {
          batch.create(ref.collection("messages").doc(), {
            type: "BOT",
            status: Status.SUCCESS,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            message: "Response from DialogFlow",
          });
        }

        if (finalized) {
          batch.update(ref, {
            status: Status.COMPLETE,
          });
        } else {
          batch.update(ref, {
            status: Status.PENDING,
          });
        }

        await batch.close();
      } catch (error) {
        functions.logger.error(error);
      }
    }
  });

exports.dialogflowFulfillment = functions.https.onRequest(
  async (request, response) => {
    const agent: any = new WebhookClient({ request, response });
    const intents = new Map<string, any>();

    intents.set("ext.fallback", (agent: any) => {
      agent.add("fallback response...");
    });

    intents.set(
      `ext-${config.instanceId}.intent.calendar`,
      async (agent: any) => {
        const { parameters } = agent;

        if (parameters?.DATE && parameters?.TIME) {
          const dateTime = extratDate(parameters.DATE, parameters.TIME);
          const dateTimeFormatted = getDateTimeFormatted(dateTime);
          try {
            await createCalendarEvent(dateTime);
            agent.add(
              `You are all set for ${dateTimeFormatted}. See you then!`
            );
          } catch (error) {
            if (error instanceof HttpsError && error.code === "not-found") {
              agent.add(`Sorry, I couldn't find your calendar.`);
            } else {
              agent.add(
                `I'm sorry, there are no slots available for ${dateTimeFormatted}.`
              );
            }
          }
        }
      }
    );

    return agent.handleRequest(intents);
  }
);

exports.createDialogflowAgent = functions.tasks
  .taskQueue()
  .onDispatch(async () => {
    const runtime = getExtensions().runtime();
    const auth = new google.auth.GoogleAuth({
      projectId: config.projectId,
      scopes: "https://www.googleapis.com/auth/dialogflow",
    });

    const agent = new dialogflow.AgentsClient({
      auth: auth,
    });

    const intentsClient = new dialogflow.IntentsClient({
      auth: auth,
    });

    try {
      functions.logger.info(`Creating Dialogflow agent ${config.agentName}...`);

      await agent.setAgent({
        agent: {
          parent: `projects/${config.projectId}/locations/global`,
          displayName: config.agentName,
          timeZone: config.timeZone,
          supportedLanguageCodes: [config.langugageCode],
        },
      });
    } catch (error) {
      functions.logger.error(error);
    }

    try {
      const agentPath = intentsClient.projectAgentPath(config.projectId);
      await intentsClient.createIntent({
        parent: agentPath,
        intent: {
          displayName: `ext-${config.instanceId}.intent.calendar`,
          messages: [
            {
              text: {
                text: ["You are all set for $date at $time. See you then!"],
              },
            },
          ],
          parameters: [
            {
              displayName: "DATE",
              entityTypeDisplayName: "@sys.date",
              mandatory: true,
              value: "$date",
              prompts: [
                "What date would you like to schedule the appointment?",
              ],
            },
            {
              displayName: "TIME",
              entityTypeDisplayName: "@sys.time",
              mandatory: true,
              value: "$time",
              prompts: [
                "What time would you like to schedule the appointment?",
              ],
            },
          ],
          webhookState: "WEBHOOK_STATE_ENABLED",
          trainingPhrases: [
            {
              type: "EXAMPLE",
              parts: [
                {
                  text: "Set an appointment on ",
                },
                {
                  text: "Wednesday",
                  entityType: "@sys.date",
                },
                {
                  text: " at ",
                },
                {
                  text: "2 PM",
                  entityType: "@sys.time",
                },
              ],
            },
            {
              type: "EXAMPLE",
              parts: [
                {
                  text: "I have a meeting ",
                },
                {
                  text: "tomorrow",
                  entityType: "@sys.date",
                },
                {
                  text: " at ",
                },
                {
                  text: "9 PM",
                  entityType: "@sys.time",
                },
              ],
            },
            {
              type: "EXAMPLE",
              parts: [
                {
                  text: "I have a meeting ",
                },
                {
                  text: "today",
                  entityType: "@sys.date",
                },
                {
                  text: " at ",
                },
                {
                  text: "9 PM",
                  entityType: "@sys.time",
                },
              ],
            },
          ],
        },
      });

      await runtime.setProcessingState(
        "PROCESSING_COMPLETE",
        `Successfully creeated a new agent named ${config.agentName}.`
      );
    } catch (error) {
      functions.logger.error(error);

      await runtime.setProcessingState(
        "PROCESSING_FAILED",
        `Agent ${config.agentName} wasn't created.`
      );
    }
  });
