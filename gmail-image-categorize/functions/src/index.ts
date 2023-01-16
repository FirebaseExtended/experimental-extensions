import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { authInit, authCallback } from "./auth";
import { getExtensions } from "firebase-admin/extensions";
import { Policy, PubSub } from "@google-cloud/pubsub";

import config from "./config";

admin.initializeApp();

const pubSubClient = new PubSub({
  scopes: ["https://www.googleapis.com/auth/pubsub"],
});

async function setSubscriptionPolicy() {
  try {
    await pubSubClient.topic(config.pubsubTopic).create();

    // The new IAM policy
    const newPolicy: Policy = {
      bindings: [
        {
          role: "roles/pubsub.publisher",
          members: ["gmail-api-push@system.gserviceaccount.com"],
        },
      ],
    };

    // Updates the IAM policy for the subscription
    const [updatedPolicy] = await pubSubClient
      .subscription(config.pubsubTopic)
      .iam.setPolicy(newPolicy);

    functions.logger.debug(
      "Updated policy for subscription: %j",
      updatedPolicy.bindings
    );
  } catch (error) {
    functions.logger.error(error);
  }
}

export const initializeAuth = functions.https.onRequest(async (req, res) => {
  try {
    functions.logger.debug(config.authCallbackUrl);
    functions.logger.debug(process.env.GCP_PROJECT);

    functions.logger.debug("Auth initialized.");

    await authInit(req, res);
  } catch (error) {
    functions.logger.error(error);
  }
});

export const callback = functions.https.onRequest(authCallback);

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
