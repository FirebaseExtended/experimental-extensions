import axios from "axios";
import { expect } from "chai";
import { readFileSync } from 'fs';

describe("firebase-ai-user-engagement", () => {
  const uri = "http://localhost:5001/demo-test/us-central1/ext-ai-user-engagement-collectEngagement/";

  function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

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

    const res = await axios.post(uri, request);
    expect(res.data).to.eql({});

    await delay(5000);

    // Wait for emulator logs to contain the user feedback message. We do this
    // by explicitly setting the Genkit env to "dev" (by using .env.local
    // config), which forces logs to be written to console, and by redirecting
    // emulator output to a tmp file (see package.json).
    let tries = 5;
    let foundLog = false;
    while (tries > 0) {
      const testLogs = readFileSync('/tmp/engagement_test_output', 'utf8');
      if (testLogs.indexOf("UserFeedback[featureName]") > 0) {
        foundLog = true;
        break;
      } else {
        console.log('.');
      }
      await delay(10000); // wait 10s
      tries--;
    }

    return expect(foundLog).to.be.true;
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

    const res = await axios.post(uri, request);

    return expect(res.data).to.eql({});
  }).timeout(10000);

  it("works as a callable function", async () => {
    const request = {
      name: "featureName",
      traceId: "12345",
      spanId: "987",
      feedback: {
        value: "positive",
        text: "This is the best feature!"
      }
    };

    const res = await axios.post(uri, { data: request });

    return expect(res.data.data).to.eql({});
  }).timeout(10000);

  it("should reject malformed request", async () => {
    const request = {
      name: "featureName",
      // traceId and spanId missing
    };

    const res = await axios.post(uri, request).catch(e => {
      return e.status;
    });

    return expect(res).to.eql(500);
  }).timeout(10000);
});
