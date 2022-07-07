import * as admin from "firebase-admin";
import setupEnvironment from "../__tests__/helpers/setupEnvironment";

const config = {
  projectId: "demo-project",
  collectionPath: "tickets",
};

admin.initializeApp({ projectId: "demo-test" });
setupEnvironment();

const db = admin.firestore();

describe("e2e testing", () => {
  describe("trello", () => {
    test("can create a ticket", async () => {
      await db.collection(config.collectionPath).add({
        name: "Test Name",
        description: "Test description",
        idList: "62c4510295cfa359af5ad3df",
      });
    });
  });
  describe("github", () => {
    test("can create a ticket", async () => {
      await db.collection(config.collectionPath).add({
        name: "Test Name",
        description: "Test description",
        idList: "62c4510295cfa359af5ad3df",
      });
    });
  });
});
