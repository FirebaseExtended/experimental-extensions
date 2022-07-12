import * as admin from "firebase-admin";
import setupEnvironment from "../__tests__/helpers/setupEnvironment";

import { TrelloProvider } from "../src/providers/trello";
import { GithubProvider } from "../src/providers/github";
import { ZendeskProvider } from "../src/providers/zendesk";

const config = {
  projectId: "demo-project",
  collectionPath: "tickets",
};

admin.initializeApp({ projectId: "demo-test" });
setupEnvironment();

const db = admin.firestore();

describe("e2e testing", () => {
  describe("trello", () => {
    beforeEach(async () => {
      const trelloProvider = new TrelloProvider();
      const list = await trelloProvider.list();

      for await (const card of list) {
        await trelloProvider.delete(card.id);
      }
    });

    test("can create a ticket", async () => {
      await db.collection(config.collectionPath).add({
        name: "Test Name",
        description: "Test description",
      });
    });
  });
  describe("github", () => {
    beforeEach(async () => {
      const githubProvider = new GithubProvider();
      const issueList = await githubProvider.list();

      for await (const issue of issueList) {
        await githubProvider.delete(issue.number);
      }
    }, 30000);

    test("can create a ticket", async () => {
      await db.collection(config.collectionPath).add({
        name: "Test Name",
        description: "Test description",
      });
    });
  });

  describe("zendesk", () => {
    beforeEach(async () => {
      const zendeskProvider = new ZendeskProvider();
      const ticketList = await zendeskProvider.list();

      for await (const ticket of ticketList) {
        await zendeskProvider.delete(ticket.id);
      }
    }, 30000);

    test("can create a ticket", async () => {
      await db.collection(config.collectionPath).add({
        name: "Test Name",
        description: "Test description",
      });
    });
  });
});
