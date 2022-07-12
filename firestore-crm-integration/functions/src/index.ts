import * as functions from "firebase-functions";
import * as log from "./logs";
import config from "./config";

import { TrelloProvider } from "./providers/trello";
import { GithubProvider } from "./providers/github";
import { ZendeskProvider } from "./providers/zendesk";

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
    const { trello, github, zendesk } = JSON.parse(config.providers);

    /** Extract document data */
    const { name, description } = change.after.data();

    if (trello) {
      const trelloProvider = new TrelloProvider();

      /** Generate create card url */
      await trelloProvider.create({ name, description });
    }

    if (github) {
      const githubProvider = new GithubProvider();

      /** Generate create card url */
      await githubProvider.create({ name, description });
    }

    if (zendesk) {
      const zendeskProvider = new ZendeskProvider();

      /** Generate create card url */
      await zendeskProvider.create({ name, description });
    }
  });
