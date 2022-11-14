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
import DialogFlow from "@google-cloud/dialogflow";
// import config from "./config";

const dialogflow = DialogFlow.v2beta1;

admin.initializeApp();

// exports.dialogflowFulfillment = functions.https.onRequest(
//   async (request, response) => {
//     if (request.method !== "POST") {
//       response.status(405).end("Method Not Allowed");
//       return;
//     }

//     // TODO: Handle auth: https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook#auth

//     const body = request.body;

//     response.status(200);
//   }
// );

exports.onInstall = functions.tasks.taskQueue().onDispatch(onInstall);

async function onInstall() {
  const agent = new dialogflow.AgentsClient({
    projectId: "extensions-testing",
  });

  const [res] = await agent.setAgent({
    agent: {
      parent: `projects/extensions-testing/locations/global`,
      displayName: "Test",
      timeZone: "America/Los_Angeles", // TODO: Get from user
    },
  });

  console.log(res);

  const intentsClient = new dialogflow.IntentsClient();

  const agentPath = intentsClient.projectAgentPath("extensions-testing");

  await intentsClient.createIntent({
    parent: agentPath,
    intent: {
      displayName: "TODO DISPLAY NAME",
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
          prompts: ["What date would you like to schedule the appointment?"],
        },
        {
          displayName: "TIME",
          entityTypeDisplayName: "@sys.time",
          mandatory: true,
          value: "$time",
          prompts: ["What time would you like to schedule the appointment?"],
        },
      ],
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
      ],
    },
  });

  // TODO
}

onInstall();
