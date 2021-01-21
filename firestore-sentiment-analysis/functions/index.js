"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const language = require("@google-cloud/language");
const client = new language.LanguageServiceClient();

var ChangeType;

(function (ChangeType) {
  ChangeType[(ChangeType["CREATE"] = 0)] = "CREATE";
  ChangeType[(ChangeType["DELETE"] = 1)] = "DELETE";
  ChangeType[(ChangeType["UPDATE"] = 2)] = "UPDATE";
})(ChangeType || (ChangeType = {}));

admin.initializeApp();

exports.fssentiment = functions.handler.firestore.document.onWrite(
  async (change) => {
    const { inputFieldName, outputFieldName } = config_1.default;

    if (inputFieldName == outputFieldName) {
      console.log(
        "Sentiment analysis: input field cannot be the same as output field. Please reconfigure your extension."
      );
      return;
    }

    const changeType = getChangeType(change);
    try {
      switch (changeType) {
        case ChangeType.CREATE:
          await handleCreateDocument(change.after);
          break;
        case ChangeType.DELETE:
          handleDeleteDocument();
          break;
        case ChangeType.UPDATE:
          await handleUpdateDocument(change.before, change.after);
          break;
      }
    } catch (err) {
      console.log("Sentiment extension error: " + err);
    }
  }
);

const extractInput = (snapshot) => {
  return snapshot.get(config_1.default.inputFieldName);
};
const getChangeType = (change) => {
  if (!change.after.exists) {
    return ChangeType.DELETE;
  }
  if (!change.before.exists) {
    return ChangeType.CREATE;
  }
  return ChangeType.UPDATE;
};

const handleCreateDocument = async (snapshot) => {
  const input = extractInput(snapshot);
  if (input) {
    await calculateSentiment(snapshot);
  }
};

const handleDeleteDocument = () => {};

const handleUpdateDocument = async (before, after) => {
  const inputAfter = extractInput(after);
  const inputBefore = extractInput(before);
  const inputHasChanged = inputAfter !== inputBefore;
  if (
    !inputHasChanged &&
    inputAfter !== undefined &&
    inputBefore !== undefined
  ) {
    return;
  }
  if (inputAfter) {
    await calculateSentiment(after);
  } else if (inputBefore) {
    await updateSentiment(after, admin.firestore.FieldValue.delete());
  }
};

const calculateSentiment = async (snapshot) => {
  const input = extractInput(snapshot);
  const result = await getSentiment(input);
  try {
    const sentimentData = result.documentSentiment;
    const sentiment = {
      magnitude: sentimentData.magnitude,
      score: sentimentData.score,
    };
    await updateSentiment(snapshot, sentiment);
  } catch (err) {
    throw err;
  }
};

const getSentiment = async (input_value) => {
  try {
    const document = {
      content: input_value,
      type: "PLAIN_TEXT",
    };
    const [sentiment] = await client.analyzeSentiment({ document });
    return sentiment;
  } catch (err) {
    throw err;
  }
};

const updateSentiment = async (snapshot, sentiment) => {
  await admin.firestore().runTransaction((transaction) => {
    transaction.update(
      snapshot.ref,
      config_1.default.outputFieldName,
      sentiment
    );
    return Promise.resolve();
  });
};
