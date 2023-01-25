import { google } from "googleapis";
import { Request, Response } from "express";

import { gmail, oAuth2Client } from "./clients";
import { saveSheetToDatastore } from "./datastore";
import config from "./config";
import { createAndAccessSecret } from "./secrets";

export const requiredScopes = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/spreadsheets",
];

/**
 * Sets up Gmail push notifications watcher for a given email and PubSub topic.
 *
 * @param {string} email The email address of the user.
 * @param {string} pubsubTopic The name of the PubSub topic.
 */
async function setUpGmailPushNotifications(email: string, pubsubTopic: string) {
  await gmail.users.watch({
    userId: email,
    requestBody: {
      labelIds: ["INBOX"],
      topicName: `projects/${config.gcpProject}/topics/${pubsubTopic}`,
    },
  });
}

export function authInit(_: Request, res: Response) {
  // Generate the url that will be used for the consent dialog.
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: requiredScopes,
    prompt: "consent",
  });

  res.redirect(authorizeUrl);
}

export async function authCallback(req: Request, res: Response) {
  // Receive the callback from Google's OAuth 2.0 server.
  if (req.query.code) {
    // Handle the OAuth 2.0 server response
    const code = req.query.code as string;

    // Get access and refresh tokens (if access_type is offline)
    let { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);
    google.options({ auth: oAuth2Client });

    if (tokens.access_token) {
      const email = await getEmail(tokens.id_token!);
      await setUpGmailPushNotifications(email!, config.pubsubTopic);
      await createAndAccessSecret(tokens.refresh_token!);

      try {
        // Create a spreadsheet for the user.
        const sheet = await google
          .sheets({ version: "v4", auth: oAuth2Client })
          .spreadsheets.create({
            requestBody: { properties: { title: "Gmail Image Categorize" } },
          });
        // Save it to Datastore, in order to be able to access it later.
        await saveSheetToDatastore(
          sheet.data.spreadsheetUrl!,
          sheet.data.spreadsheetId!,
          email!
        );
      } catch (error) {
        res
          .status(500)
          .send("Authentication successful, creating a sheet failed.");

        throw error;
      }

      res.status(200).send("Successfully authenticated.");
    } else {
      res.status(500).send("Authentication failed.");
    }
  }
}

async function getEmail(idToken?: string) {
  if (!idToken) throw new Error("No token provided");

  const ticket = await oAuth2Client.verifyIdToken({
    idToken: idToken,
    audience: config.clientId,
  });
  const payload = ticket.getPayload();
  console.log(payload);
  if (payload) {
    const userid = payload["email"];
    return userid;
  } else {
    throw new Error("No payload");
  }
}
