import * as functions from "firebase-functions";
import { apikeys_v2, google } from "googleapis";
import * as admin from "firebase-admin";
import { getEventarc } from "firebase-admin/eventarc";
import config from "./config";

admin.initializeApp();

const eventChannel =
  process.env.EVENTARC_CHANNEL &&
  getEventarc().channel(process.env.EVENTARC_CHANNEL);

export const apiKeysDiagnostic = functions.pubsub
  .schedule(config.schedule)
  .onRun(async () => {
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: "https://www.googleapis.com/auth/cloud-platform",
      });

      const authClient = await auth.getClient();

      const client = new apikeys_v2.Apikeys({
        auth: authClient,
      });

      const { data } = await client.projects.locations.keys.list({
        parent: `projects/${config.projectId}/locations/global`,
      });

      if (!data.keys) return;

      // Check if any of the API keys are not restricted
      const unsecuredKeys = data.keys.filter((key) => !key.restrictions);
      functions.logger.log(JSON.stringify(unsecuredKeys, null, 2));

      // If there are any unsecured keys, send an email notification
      if (eventChannel && unsecuredKeys.length > 0) {
        functions.logger.info("Sending event");

        await eventChannel.publish({
          type: "firebase.extensions.api-keys-diagnostic.unsecured",
          subject: "Unsecured API Keys Found",
          data: {
            message: `The following API keys have no restrictions:\n\n${unsecuredKeys
              .map((key) => key.name)
              .join("\n")}`,
            keys: JSON.stringify(unsecuredKeys),
          },
        });
      }
    } catch (error) {
      console.error("Error: ", error);
    }
  });
