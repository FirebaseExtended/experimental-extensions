# Transcribe Audio

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Transcribes speech in audio files, writing the transcription to Storage and/or to Firestore.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/storage-transcribe-audio)

### Firebase CLI

```bash
firebase ext:install firebase/storage-transcribe-audio --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: The Firebase Storage Transcribe Audio Extension enhances your Firebase project by automatically transcribing audio files stored in your Cloud Storage bucket and integrating the transcriptions with your Firestore or Storage.

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

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. Realtime Database instances are located in `us-central1`. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Cloud Storage bucket for input and output: The Cloud Storage bucket that the extension should be listening to. Files uploaded to this bucket will be transcribed by the extension. If cloud storage output is enabled, transcriptions will be written to this bucket.

- Firestore collection for transcriptions: The Firestore collection that the extension will write transcriptions to. _This field is ignored if output to firestore is not selected._

- BCP-47 code of the transcription language: The BCP-47 code of the transcription language, as shown in the [Language support documentation](https://cloud.google.com/speech-to-text/docs/languages)

- Language model used for transcription: Which kind of use-case should the speech-to-text transcription algorithm be honed for? For details, see [the model field in the documentation](https://cloud.google.com/speech-to-text/docs/reference/rest/v1/RecognitionConfig)
  If you're not sure, just use the default.

**Cloud Functions:**

- **transcribeAudio:** Listens for new audio files uploaded to a specified Cloud Storage bucket, transcribes the speech in those files, then stores the transcription in storage, or in firestore, or in both.

**APIs Used**:

- speech.googleapis.com (Reason: Used for transcribing the audio of sound files.)

**Access Required**:

This extension will operate with the following project IAM roles:

- storage.admin (Reason: Allows the extension to write to your Cloud Storage.)

- datastore.user (Reason: Allows the extension to write to your Firestore Database instance.)

