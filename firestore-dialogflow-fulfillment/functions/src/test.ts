import DialogFlow from "@google-cloud/dialogflow";
// import config from "./config";

const dialogflow = DialogFlow.v2beta1;

// on new document
// call detectIntent with document ID as session + text
// save response into the DB
// Send any further updates with the same session
// webhook checks for required fields, does calendar integration and returns success.


async function foo() {
  const s = new dialogflow.SessionsClient();

  const [i] = await s.detectIntent({
    session:
      "projects/extensions-testing/agent/sessions/adrs4e60-7868-b304-5bb1-e1654b3554d1",
    queryInput: {
      text: {
        text: "8PM",
        languageCode: 'en',
      },
    }
  });

  console.log(i);
  console.log(i.queryResult?.parameters);
}

foo();
