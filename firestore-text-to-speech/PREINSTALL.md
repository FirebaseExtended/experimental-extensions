This extension converts text from Firestore documents into speech using the Google Cloud Text-to-Speech API and saves the generated audio files in Cloud Storage for Firebase.


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
