import axios from "axios";
import { expect } from "chai";
import { readFileSync } from 'fs';
import { deleteApp, initializeApp } from "firebase/app";
import { getFunctions, httpsCallableFromURL } from "firebase/functions";
import { initializeAppCheck, getToken, CustomProvider } from "firebase/app-check";

describe("firebase-ai-user-engagement", () => {

  const app = initializeApp({
    projectId: 'demo-test',
  });

  const functions = getFunctions(app);

  let appCheckToken = "";
  const appCheck = initializeAppCheck(app, {
    provider: new CustomProvider({
      getToken: () => {
        return Promise.resolve({
          token: appCheckToken,
          expireTimeMillis: Date.now() + 1000 * 60 * 60*24, // 1 day
        });
      }
    }),

    isTokenAutoRefreshEnabled: true,
  });

  const uriRegular = "http://localhost:5001/demo-test/us-central1/ext-ai-user-engagement-regular-collectEngagement/";
  const uriCallable = "http://localhost:5001/demo-test/us-central1/ext-ai-user-engagement-callable-collectEngagement/";
  const uriAppCheck = "http://localhost:5001/demo-test/us-central1/ext-ai-user-engagement-app-check-collectEngagement/";

  const callableFunction = httpsCallableFromURL(functions, uriCallable);
  const appCheckFunction = httpsCallableFromURL(functions, uriAppCheck);

  after(async () => {
    deleteApp(app);

    // Something is causing these tests to hang after completion. If we haven't
    // exited after 10s, force shutdown here.
    setTimeout(() => {
      console.log("Shutting down for real");
      process.exit(0);
    }, 10000);
  });

  function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  async function expectMessage(message: string) {
    await delay(5000);

    // Wait for emulator logs to contain the user feedback message. We do this
    // by explicitly setting the Genkit env to "dev" (by using .env.local
    // config), which forces logs to be written to console, and by redirecting
    // emulator output to a tmp file (see package.json).
    let tries = 5;
    let foundLog = false;
    while (tries > 0) {
      const testLogs = readFileSync('/tmp/engagement_test_output', 'utf8');
      if (testLogs.indexOf(message) > 0) {
        foundLog = true;
        break;
      } else {
        console.log('.');
      }
      await delay(10000); // wait 10s
      tries--;
    }

    return expect(foundLog).to.be.true;
  }

  describe("regular function", () => {

    it("should collect user feedback", async () => {
      const request = {
        name: "featureName",
        traceId: "12345",
        spanId: "987",
        feedback: {
          value: "positive",
          text: "This is the best feature!"
        }
      };

      const res = await axios.post(uriRegular, request);
      expect(res.data).to.eql({});

      return await expectMessage("UserFeedback[featureName]");
    }).timeout(60000);

    it("should collect user acceptance", async () => {
      const request = {
        name: "featureName",
        traceId: "12345",
        spanId: "987",
        acceptance: {
          value: "accepted",
        }
      };

      const res = await axios.post(uriRegular, request);
      expect(res.data).to.eql({});

      return await expectMessage("UserAcceptance[featureName]");
    }).timeout(60000);

    it("should reject malformed request", async () => {
      const request = {
        name: "featureName",
        // traceId and spanId missing
      };

      const res = await axios.post(uriRegular, request).catch(e => {
        return e.status;
      });

      return expect(res).to.eql(500);
    }).timeout(10000);
  });

  describe("callable function", () => {

    it("should collect feedback", async () => {
      const request = {
        name: "featureNameCallable",
        traceId: "12345",
        spanId: "987",
        feedback: {
          value: "positive",
          text: "This is the best feature!"
        }
      };

      const res = await callableFunction(request);
      expect(res.data).to.eql({});

      return await expectMessage("UserFeedback[featureNameCallable]");
    }).timeout(60000);

    it("should reject malformed request", async () => {
      const request = {
        name: "featureName",
        // traceId and spanId missing
      };

      const res = await callableFunction(request).catch(e => {
        return e.code;
      });

      return expect(res).to.eql("functions/invalid-argument");
    }).timeout(10000);
  });

  describe("callable function with app check", () => {

    it("should collect feedback", async () => {
      const request = {
        name: "featureNameAppCheck",
        traceId: "12345",
        spanId: "987",
        feedback: {
          value: "positive",
          text: "This is the best feature!"
        }
      };
      appCheckToken = "fake-token";
      getToken(appCheck, true);
      await delay(1000); // Wait to pick up the new token

      const res = await appCheckFunction(request);

      return expect(res.data).to.eql({});
    }).timeout(10000);

    it("should reject missing app check info", async () => {
      const request = {
        name: "featureName",
        traceId: "12345",
        spanId: "987",
        feedback: {
          value: "positive",
          text: "This is the best feature!"
        }
      };
      appCheckToken = "";
      getToken(appCheck, true);
      await delay(1000); // Wait to pick up the new token

      const res = await appCheckFunction(request).catch(e => {
        return e.code;
      });

      return expect(res).to.eql("functions/unauthenticated");
    }).timeout(10000);
  });
});
