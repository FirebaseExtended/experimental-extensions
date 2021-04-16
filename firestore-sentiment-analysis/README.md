# Sentiment Analysis

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Determines the sentiment magnitude and score for given text values in Firestore

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/firestore-sentiment-analysis)

### Firebase CLI

```bash
firebase ext:install firebase/firestore-sentiment-analysis --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: Use this extension to analyze strings (for example, product reviews) written to a Cloud Firestore collection for sentiment.

This extension listens to your specified Cloud Firestore collection. If you add a string to a specified field in any document within that collection, this extension:

- Processes the sentiment of the text using Google Cloud's Natural Language Processing API. This generates the sentiment and the score for the text. More information on this API can be found [here](https://cloud.google.com/natural-language/docs/basics#:~:text=Sentiment%20analysis%20response%20fields,-A%20sample%20analyzeSentiment&text=score%20of%20the%20sentiment%20ranges,%2C%20between%200.0%20and%20%2Binf%20.).
- Adds the sentiment of the string to a separate specified field in the same document.

If the original field of the document is updated, then the sentiment will be automatically updated, as well.

#### Additional setup

Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

#### Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s free tier:
  - Cloud Language API
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#expandable-24))

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Collection path: What is the path to the collection that contains the strings that you want to analyze?

- Input field name: What is the name of the field that contains the string that you want to analyze?

- Sentiment output field name: What is the name of the field where you want to store your sentiment information?

**Cloud Functions:**

- **fssentiment:** Listens for writes of new strings to your specified Cloud Firestore collection, determines sentiment, then writes the sentiment magnitude and score back to the same document.

**APIs Used**:

- language.googleapis.com (Reason: To use Google Natural Language Processing to apply sentiment analysis.)

**Access Required**:

This extension will operate with the following project IAM roles:

- datastore.user (Reason: Allows the extension to write to your Firestore Database instance.)

