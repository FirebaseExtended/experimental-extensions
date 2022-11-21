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
import config from "./config";
import Status from "./types/status";
import Conversation from "./types/conversation";
var fs = require("fs");

admin.initializeApp();

const dialogflow = DialogFlow.v2beta1;
const sessionClient = new dialogflow.SessionsClient({
  projectId: config.projectId,
  ...(fs.existsSync(config.servicePath) && { keyFilename: config.servicePath }),
});

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
    const { type, message } = change.data() as any; // TODO: add types
    const ref = admin
      .firestore()
      .collection("conversations")
      .doc(conversationId);

    await ref.update({
      updated_at: FieldValue.serverTimestamp(),
      message_count: FieldValue.increment(1),
    });

    if (type === "USER") {
      const sessionPath = sessionClient.projectAgentSessionPath(
        config.projectId,
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
        },
      };

      const [intent] = await sessionClient.detectIntent(request);

      console.log(intent);

      const batch = admin.firestore().bulkWriter();

      batch.update(change.ref, {
        status: "SUCCESS",
      });

      if (intent.queryResult?.fulfillmentText) {
        batch.create(ref.collection("messages").doc(), {
          type: "BOT",
          status: Status.SUCCESS,
          created_at: FieldValue.serverTimestamp(),
          message: intent.queryResult.fulfillmentText,
        });
      } else {
        batch.create(ref.collection("messages").doc(), {
          type: "BOT",
          status: Status.SUCCESS,
          created_at: FieldValue.serverTimestamp(),
          message: "Response from DialogFlow",
        });
      }

      const finalized = true;

      if (finalized) {
        batch.update(
          admin.firestore().collection("conversations").doc(conversationId),
          {
            status: Status.COMPLETE,
          }
        );
      }

      await batch.close();
    }
  });

exports.dialogflowFulfillment = functions.https.onRequest(
  async (request, response) => {
    const agent1 = new WebhookClient({ request, response });
    const intents = new Map<string, any>();
    intents.set("ext.fallback", (agent: any) => {
      agent.add("fallback response...");
    });

    intents.set("intent.calendar", (agent: any) => {
      const { parameters } = agent;
      console.log(parameters);

      if (parameters?.DATE && parameters?.TIME) {
        var date = new Date(parameters.DATE);
        var time = new Date(parameters.TIME);
        var dateTime = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          time.getHours(),
          time.getMinutes()
        );

        console.log(time);

        let dateTimeFormatted = new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          weekday: "long",
        }).format(dateTime);

        agent.add(`You are all set for ${dateTimeFormatted}. See you then!`);
      }
    });

    return agent1.handleRequest(intents);
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
