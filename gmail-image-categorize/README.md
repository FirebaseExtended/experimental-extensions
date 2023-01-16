# Image Labeling

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Performs image labeling on images uploaded to Storage and writes labels to Firestore.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/storage-image-labeling)

### Firebase CLI

```bash
firebase ext:install firebase/storage-image-labeling --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: This extension will label (classify) from any `jpg` or `png` images uploaded to Cloud Storage and write the labels to Firestore.

# Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

<!-- List all products the extension interacts with -->

- Cloud Functions
- Cloud Vision API
- Cloud Storage
- Cloud Firestore

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier (Blaze) billing plan is required because the extension uses Cloud Vision API.

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. Realtime Database instances are located in `us-central1`. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Cloud Storage bucket for images: To which Cloud Storage bucket will you upload images on which you want to perform labelling?

- Collection path: What is the path to the collection where labels will be written to.

**Cloud Functions:**

- **labelImage:** Listens to incoming Storage documents, executes image labeling on them and writes labels back to Storage into a preconfigured location.

**APIs Used**:

- vision.googleapis.com (Reason: Powers all Vision tasks performed by the extension.)

**Access Required**:

This extension will operate with the following project IAM roles:

- storage.admin (Reason: Allows the extension to write to your Cloud Storage.)

- datastore.user (Reason: Allows the extension to write to your Firestore Database instance.)

