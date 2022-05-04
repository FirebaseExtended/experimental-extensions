# Firestore Natural Language Processing

**Description**: Performs Natural Language Processing on strings written to a Cloud Firestore collection (uses Cloud Natural Language API).



**Details**: Use this extension to perform NLP tasks on strings (for example, reviews) written to a Cloud Firestore collection. The tasks available are sentiment analysis, entity extraction and text classification.

This extension listens to your specified Cloud Firestore collection. If you add a string to a specified field in any document within that collection, this extension:

- Performs the configured NLP tasks using the input string.
- Adds the NLP data of the string to a separate specified field in the same document.

You specify the desired NLP tasks at configuration time. All tasks are powered by the Google [Cloud Natural Language API](https://cloud.google.com/natural-language/docs/). The options offered are:
- Sentiment analysis.
- Entity extraction.
  - Entity extraction offers additional customization. You can specify the types of entities to save (for example, `LOCATION`, `PERSON`) and specify if the extension should save common noun entities.
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




**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).


* Collection path: What is the path to the collection that contains the strings on which to perform NLP?


* Input field name: What is the name of the field that contains the string on which to perform NLP?


* Output field name: What is the name of the field where you want to store NLP data?


* Tasks: What NLP tasks do you want the extension to perform? One or more of: sentiment analysis, entity extraction and text classification.


* Entities to filter: What types of entities do you want entity extraction to retain? 


* Save common entities: Do you want entity extraction to also retain common names entities (for example, 'users')?




**Cloud Functions:**

* **firestoreNlpDocCreate:** Listens for new documents in your specified Cloud Firestore collection, performs the configured NLP tasks on a specific string, then writes the output from the NLP tasks back to the same document.
* **firestoreNlpDocUpdate:** Same functionality as `firestoreNlpDocCreate`, but listens for update on documents. Checks if input field has changed and, if so, overwrites old NLP data with new NLP data.


**APIs Used**:

* language.googleapis.com (Reason: Powers all NLP tasks performed by the extension.)



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows the extension to write NLP data to Cloud Firestore.)
