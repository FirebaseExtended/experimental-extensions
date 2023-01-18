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
    /** Create topic */
    try {
      const [topic] = await pubSubClient.createTopic(config.pubsubTopic);
      console.log("Created topic ", topic);
    } catch (ex) {
      console.warn("create topic wanring");
    }

    // The new IAM policy
    const newPolicy: Policy = {
      bindings: [
        {
          role: "roles/pubsub.publisher",
          members: ["gmail-api-push@system.gserviceaccount.com"],
        },
      ],
    };

    try {
      /** Create subscription */
      await pubSubClient.createSubscription(
        config.pubsubTopic,
        config.pubsubTopic
      );

      console.log(`Subscription ${config.pubsubTopic} created.`);
    } catch (ex) {
      console.warn("subscription warning:");
    }

    // Updates the IAM policy for the subscription
    try {
      const [updatedPolicy] = await pubSubClient
        .subscription(config.pubsubTopic)
        .iam.setPolicy(newPolicy);

      functions.logger.debug(
        "Updated policy for subscription: %j",
        updatedPolicy.bindings
      );
    } catch (ex) {
      console.warn("updated policy warning:");
    }
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

export const callback = functions.https.onRequest(async (req, res) => {
  try {
    functions.logger.debug(config.authCallbackUrl);
    functions.logger.debug(process.env.GCP_PROJECT);

    functions.logger.debug("callback initialized.");

    await authCallback(req, res);
  } catch (error) {
    functions.logger.error(error);
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
