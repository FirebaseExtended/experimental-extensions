The Firebase Storage Transcribe Audio Extension enhances your Firebase project by automatically transcribing audio files stored in your Cloud Storage bucket and integrating the transcriptions with your Firestore or Storage.

The extension leverages Google Cloud Speech-to-Text API to process audio files when they are added or updated in the specified Cloud Storage bucket.

### Real-time audio transcription
Automatically transcribe audio files stored in your Cloud Storage bucket when new files are added or updated.

### Firestore and Storage integration
Seamlessly integrates with Firestore to store transcriptions in your collection or with Storage to save transcriptions alongside audio files (depending on your configuration).

### Configurable collection and path
Specify the collection or path you want the extension to use for saving transcriptions.

### Pre-requisites
Ensure you have a Cloud Storage bucket set up in your Firebase project. This bucket will be monitored by the extension for audio files.

### Additional Setup
Before installing this extension, ensure that you have enabled the Google Cloud Speech-to-Text API for your project and your Firebase project is on the Blaze (pay as you go) plan.

Follow the instructions provided in the [Google Cloud Speech-to-Text API documentation](https://cloud.google.com/speech-to-text/docs) to enable the API for your project.

#### Language and Model Configuration
During the installation process, you will be asked to provide the BCP-47 code for the transcription language and select a language model. You can find the supported languages and BCP-47 codes in the [Language support documentation](https://cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages).

The language model determines the use-case the speech-to-text transcription algorithm should be optimized for. You can find more details on the available models in the [model field documentation](https://cloud.google.com/speech-to-text/docs/reference/rest/v1/RecognitionConfig). If you are unsure, you can use the default model.

### Billing
To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Speech-to-Text API
  - Cloud Storage
  - Cloud Functions (Node.js 10+ runtime. See [FAQs](https://firebase.google.com/support/faq#extensions-pricing))
  - Cloud Firestore (optional, depending on configuration)
  - Eventarc (optional, depending on configuration)