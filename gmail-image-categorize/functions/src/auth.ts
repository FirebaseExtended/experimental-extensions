import { google } from "googleapis";
import { gmail } from "./clients";
import config from "./config";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const auth = require("@google-cloud/express-oauth2-handlers");

const requiredScopes = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/spreadsheets",
];

export const authGmail = auth("datastore", requiredScopes, "email", true);

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

async function onSuccess(req: any, res: any) {
  let email;

  try {
    // Set up the googleapis library to use the returned tokens.
    email = await authGmail.auth.authedUser.getUserId(req, res);
    const OAuth2Client = await authGmail.auth.authedUser.getClient(
      req,
      res,
      email
    );
    google.options({ auth: OAuth2Client });
  } catch (err) {
    console.log(err);
    throw err;
  }

  try {
    await setUpGmailPushNotifications(email, config.pubsubTopic);
  } catch (err: any) {
    if (
      !err
        .toString()
        .includes("one user push notification client allowed per developer")
    ) {
      throw err;
    }

    console.log(err);
  }

  res.send(`Successfully set up Gmail push notifications.`);
}

// If the authorization process fails, return an error message.
const onFailure = (err: any, req: any, res: any) => {
  console.log(err);
  res.send(`An error has occurred in the authorization process.`);
};

export const authInit = authGmail.routes.init;
export const authCallback = authGmail.routes.cb(onSuccess, onFailure);
export const authedUser = authGmail.auth.authedUser;
