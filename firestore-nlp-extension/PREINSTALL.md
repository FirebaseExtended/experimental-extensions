Use this extension to perform natural language processing (NLP) tasks on strings (for example, reviews) written to a Cloud Firestore collection. The tasks available are sentiment analysis, entity extraction and text classification.

This extension listens to your specified Cloud Firestore collection. If you add a string to a specified field in any document within that collection, this extension:

- Performs the configured NLP tasks using the input string.
- Adds the NLP data of the string to a separate specified field in the same document.

You specify the desired NLP tasks at configuration time. All tasks are powered by the Google [Cloud Natural Language API](https://cloud.google.com/natural-language/docs/). The options offered are:
- Sentiment analysis.
- Entity extraction. Additional customization is available for this task. You can specify the types of entities to save (for example, `LOCATION`, `PERSON`) and specify if the extension should save common noun entities.
- Text classification.

If the original input field of the document is updated, then the NLP data will be automatically updated, as well.

#### Additional setup

Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

#### Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

- Cloud Natural Language API
- Cloud Firestore
- Cloud Functions

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)
