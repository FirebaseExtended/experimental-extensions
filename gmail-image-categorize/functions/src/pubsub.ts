import * as functions from "firebase-functions";
import { Policy, PubSub } from "@google-cloud/pubsub";

import config from "./config";

export const pubSubClient = new PubSub({
  scopes: ["https://www.googleapis.com/auth/pubsub"],
});

export async function setTopicPolicy() {
  try {
    await pubSubClient.topic(config.pubsubTopic).create();

    // The new IAM policy
    const newPolicy: Policy = {
      bindings: [
        {
          role: "pubsub.publisher",
          members: ["gmail-api-push@system.gserviceaccount.com"],
        },
      ],
    };
    const [updatedPolicy] = await pubSubClient
      .topic(config.pubsubTopic)
      .iam.setPolicy(newPolicy);

    functions.logger.debug(
      `Updated policy for subscription: ${updatedPolicy.bindings}`
    );
  } catch (error) {
    functions.logger.error(error);
  }
}
