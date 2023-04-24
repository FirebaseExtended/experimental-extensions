# Text to Speech with Firestore and Storage

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Converts text from Firestore documents into spoken audio files using Google Cloud Text-to-Speech API.



**Details**: This extension converts text from Firestore documents into speech using the Google Cloud Text-to-Speech API and saves the generated audio files in Cloud Storage for Firebase.


### Monitor the specified Firestore collection for new documents
This extension reads the text field from newly created documents and converts the text into speech using the Google Cloud Text-to-Speech API.

### Saving audio to the defined storage bucket
The the resulting audio files are then saved in the specified Cloud Storage bucket.

### Billing
To install an extension, your project must be on the Blaze (pay as you go) plan.

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service's no-cost tier:
  - Google Cloud Text-to-Speech API
  - Cloud Firestore
  - Cloud Storage for Firebase
  - Cloud Functions (Node.js 10+ runtime. See [FAQs](https://firebase.google.com/support/faq#extensions-pricing))




**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Collection path: What collection path contains documents with text you want to synthesize?


* Bucket name: In which storage bucket do you want to keep synthesized text?


* Storage path: What is the location in your storage bucket you would like to keep synthesized audio? By default this will be the root of the bucket.


* Enable ssml: If set to \"Yes\", text processed by this extension will be assumed to be written in ssml.

* Language code: What language code do you want to use?

* Voice type: What voice type do you want to use?

* SSML Gender: What SSML Gender do you want to use?

* SSML Gender: What audio encoding do you want to use?

* Enable per document overrides.: If set to \"Yes\", options for synthesizing audio will be overwritten  by fields in the document containing the text to be synthesized.

* Voice name: Alternatively you may specify a voice name, this will override other extension synthesization parameters (language code, SSML Gender, Voice type).




**Cloud Functions:**

* **textToSpeech:** Processes document changes in the specified Cloud Firestore collection, writing synthesized natural speech files to Cloud Storage



**APIs Used**:

* texttospeech.googleapis.com (Reason: To use Google Text to Speech to generate natural sounding speech from your strings in Firestore.)



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows the extension to write translated strings to Cloud Firestore.)

* storage.objectAdmin (Reason: Allows the extension to write translated strings to Cloud Storage.)
