import { google } from "googleapis";
import config from "./config";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const auth = require("@google-cloud/express-oauth2-handlers");
const gmail = google.gmail("v1");

// Specify the access scopes required. If authorized, Google will grant your
// registered OAuth client access to your profile, email address, and data in
// your Gmail and Google Sheets.
const requiredScopes = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/spreadsheets",
];

const authGmail = auth("datastore", requiredScopes, "email", true);

/**
 *
 * @param {string} email
 * @param {string} pubsubTopic
 * @return {undefined}
 */
function setUpGmailPushNotifications(email: string, pubsubTopic: string) {
  gmail.users.watch({
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
    email = await auth.auth.authedUser.getUserId(req, res);
    const OAuth2Client = await auth.auth.authedUser.getClient(req, res, email);
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
  }

  res.send(`Successfully set up Gmail push notifications.`);
}

// If the authorization process fails, return an error message.
const onFailure = (err: any, req: any, res: any) => {
  console.log(err);
  res.send(`An error has occurred in the authorization process.`);
};

export const authInit = authGmail.routes.init;
export const authCallback = authInit.cb(onSuccess, onFailure);
