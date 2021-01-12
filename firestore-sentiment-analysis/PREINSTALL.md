Use this extension to analyze strings (for example, product reviews) written to a Cloud Firestore collection for sentiment.

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
