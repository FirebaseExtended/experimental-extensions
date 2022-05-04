# Firestore Natural Language Processing

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Perform Natural Language Processing (NLP) tasks on strings written to Firestore.



**Details**: Use this extension to perform natural language processing (NLP) tasks on strings (for example, reviews) written to a Cloud Firestore collection. The tasks available are sentiment analysis, entity extraction and text classification.

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




**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Collection path: What is the path of the collection that you would like to process? You may use `{wildcard}` notation to match a subcollection of all documents in a collection (for example: `travelLocations/{location_id}/reviews`).


* Input field name: What is the name of the field that contains the string that you want NLP to be performed on?


* Output field name: What is the name of the field that will contain the output(s) from NLP tasks?


* NLP task to perform on the input data.: Select one or more NLP tasks to perform on the input data.


* Entities to filter.: If you perform entity extraction, which entity types are you interested in? (ignored if entity extraction is not performed)


* Do you want entities that are common nouns to be saved?: If you perform entity extraction, entities can either be "common" or "proper". Common entities can be numerous  so you can select "No" so that they are not saved.




**Cloud Functions:**

* **firestoreNlpDocCreate:** Listens for new documents in your specified Cloud Firestore collection, performs the configured NLP tasks on a specific string, then writes the output from the NLP tasks back to the same document. The NLP tasks available are entity extraction, sentiment analysis and content classification.

* **firestoreNlpDocUpdate:** Listens for updates to strings in your specified Cloud Firestore collection, performs the configured NLP tasks on the string, then writes the output from the NLP tasks back to the same document (overriding any previous data). The NLP tasks available are entity extraction, sentiment analysis and content classification.



**APIs Used**:

* language.googleapis.com (Reason: Powers all NLP tasks performed by the extension.)



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows the extension to read input data from Cloud Firestore and write the NLP data to Cloud Firestore.)
