import axios from "axios";
import { expect } from "chai";

describe("firebase-ai-user-engagement", () => {
  const uri = "http://localhost:5001/demo-test/us-central1/ext-ai-user-engagement-collectEngagement/";

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

    return expect(res.data).to.eql({});
  }).timeout(10000);

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
