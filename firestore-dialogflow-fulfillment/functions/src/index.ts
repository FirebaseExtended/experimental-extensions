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

import config from "./config";
import Status from "./types/status";
import Conversation from "./types/conversation";
import { extratDate, getDateTimeFormatted } from "./util";

admin.initializeApp();

var fs = require("fs");

const firebaseConfig = process.env.FIREBASE_CONFIG;
if (firebaseConfig === undefined) {
  throw new Error("Firebase Config is undefined");
}

const adminConfig: {
  databaseURL: string;
  storageBucket: string;
  projectId: string;
} = JSON.parse(firebaseConfig);

const PROJECT_ID = adminConfig.projectId;

const dialogflow = DialogFlow.v2beta1;
const sessionClient = new dialogflow.SessionsClient({
  projectId: PROJECT_ID,
  ...(fs.existsSync(config.servicePath) && { keyFilename: config.servicePath }),
});

const SCOPE = ["https://www.googleapis.com/auth/calendar"];

async function createCalendarEvent(dateTime: Date) {
  functions.logger.info(
    "Authenticating with Google Calendar API for project: " + PROJECT_ID
  );

  const auth = new google.auth.GoogleAuth({
    scopes: SCOPE,
    projectId: PROJECT_ID,
    ...(fs.existsSync(config.servicePath) && {
      keyFilename: config.servicePath,
    }),
  });

  const authClient = await auth.getClient();

  const calendar = google.calendar({
    version: "v3",
    auth: authClient,
  });

  var dateTimeEnd = new Date(
    dateTime.getTime() + config.defaultDuration * 60000
  );

  const event: calendar_v3.Schema$Event = {
    summary: "Meeting by DialogFlow",
    description: "This is a meeting created by DialogFlow",
    start: {
      dateTime: dateTime.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: dateTimeEnd.toISOString(),
      timeZone: "UTC",
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
    functions.logger.info("Inserting a new event for: " + PROJECT_ID);

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
    started_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    message_count: 0,
  });

  batch.create(ref.collection("messages").doc(), {
    type: "USER",
    uid: uid,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
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

    functions.logger.log("New message", { conversationId, type, message, uid });

    await ref.update({
      updated_at: FieldValue.serverTimestamp(),
      message_count: FieldValue.increment(1),
    });

    if (type === "USER") {
      const sessionPath = sessionClient.projectAgentSessionPath(
        PROJECT_ID,
        conversationId
      );

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            languageCode: "en", // TODO make this configurable?
            text: message,
          },
        },
        queryParams: {
          timeZone: "UTC",
          uid: uid,
        },
      };

      const [intent] = await sessionClient.detectIntent(request);

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
    }
  });

exports.dialogflowFulfillment = functions.https.onRequest(
  async (request, response) => {
    const agent = new WebhookClient({ request, response });
    const intents = new Map<string, any>();

    intents.set("ext.fallback", (agent: any) => {
      agent.add("fallback response...");
    });

    intents.set("intent.calendar", async (agent: any) => {
      const { parameters } = agent;

      if (parameters?.DATE && parameters?.TIME) {
        const dateTime = extratDate(parameters.DATE, parameters.TIME);
        const dateTimeFormatted = getDateTimeFormatted(dateTime);
        try {
          await createCalendarEvent(dateTime);
          agent.add(`You are all set for ${dateTimeFormatted}. See you then!`);
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
    });

    return agent.handleRequest(intents);
  }
);

// exports.onInstall = functions.tasks.taskQueue().onDispatch(onInstall);

// async function onInstall() {
//   const agent = new dialogflow.AgentsClient({
//     projectId: "extensions-testing",
//   });

//   await agent.setAgent({
//     agent: {
//       parent: `projects/extensions-testing/locations/global`,
//       displayName: "Test", // TODO automate
//       timeZone: "America/Los_Angeles", // TODO: Get from user
//     },
//   });

//   const intentsClient = new dialogflow.IntentsClient();

//   const agentPath = intentsClient.projectAgentPath("extensions-testing");

//   await intentsClient.createIntent({
//     parent: agentPath,
//     intent: {
//       displayName: "intent.calendar",
//       messages: [
//         {
//           text: {
//             text: ["You are all set for $date at $time. See you then!"],
//           },
//         },
//       ],
//       parameters: [
//         {
//           displayName: "DATE",
//           entityTypeDisplayName: "@sys.date",
//           mandatory: true,
//           value: "$date",
//           prompts: ["What date would you like to schedule the appointment?"],
//         },
//         {
//           displayName: "TIME",
//           entityTypeDisplayName: "@sys.time",
//           mandatory: true,
//           value: "$time",
//           prompts: ["What time would you like to schedule the appointment?"],
//         },
//       ],
//       trainingPhrases: [
//         {
//           type: "EXAMPLE",
//           parts: [
//             {
//               text: "Set an appointment on ",
//             },
//             {
//               text: "Wednesday",
//               entityType: "@sys.date",
//             },
//             {
//               text: " at ",
//             },
//             {
//               text: "2 PM",
//               entityType: "@sys.time",
//             },
//           ],
//         },
//       ],
//     },
//   });
// }

// onInstall();
