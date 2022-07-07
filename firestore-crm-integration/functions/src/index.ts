import * as functions from "firebase-functions";
import * as log from "./logs";
import config from "./config";
import { trelloApi, githubApi } from "./api";

// const zendesk = NodeZendesk.createClient({
//   username: "username",
//   token: "token",
//   remoteUri: "https://remote.zendesk.com/api/v2",
// });

exports.createUser = functions.auth.user().onCreate(async (user) => {
  if (!user.email) {
    throw new Error("Cannot sync user - no email address found");
  }

  /** Add code for creating user on the provider platform */
});

exports.createIssue = functions.firestore
  .document(config.collectionPath)
  .onWrite(async (change, context) => {
    log.start();

    /** find configuration */
    const { trello, github } = JSON.parse(config.providers);

    if (!trello) {
      const { host, key, token } = trello;

      /** Extract document data */
      const { name, description, idList } = change.after.data();

      /** Generate create card url */
      const url = `${host}/card?idList=${idList}&name=${name}&description=${description}&key=${key}&token=${token}`;

      /** Post new issue */
      await trelloApi(url);
    }

    if (github) {
      const { token, owner, repo } = github;
      await githubApi({
        token,
        owner,
        repo,
        title: "Found a bug!",
        body: "I'm having a problem with this.",
      });
    }
  });
