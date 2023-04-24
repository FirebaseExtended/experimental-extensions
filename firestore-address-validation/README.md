# Firestore Address Validation

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Validates addresses in Cloud Firestore using the Google Maps API.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/firestore-address-validation)

### Firebase CLI

```bash
firebase ext:install firebase/firestore-address-validation --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: The Address Validation Extension enhances your Firebase project by validating and standardizing addresses in your Firestore documents in real-time.

The extension leverages `Google Maps Geocoding API` to automatically validate and standardize addresses when new documents are created or updated in the specified Firestore collection.

### Real-time address validation

Automatically validate and standardize addresses using when new documents are added or updated.

### Firestore integration

Seamlessly integrates with your [Firestore](https://firebase.google.com/products/firestore) collection to store validated addresses in your documents.

### Configurable collection

Specify the collection you want the extension to monitor for updates and new documents.

### Pre-requisites

Ensure you have a Firestore collection set up in your Firebase project. This collection will be monitored by the extension to validate addresses. Provide the collection ID during the extension installation.

### Additional Setup

Before installing this extension, make sure that you've `enabled` the `Google Maps Geocoding API` for your project and obtained an `API key`.

Follow the instructions provided in the [Google Maps API documentation](https://developers.google.com/maps/documentation/geocoding/start) to set up your API key.

Billing
To install an extension, your project must be on the Blaze (pay as you go) plan

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
- Google Maps Geocoding API
- Cloud Firestore
- Cloud Functions (Node.js 10+ runtime. See FAQs)

**Configuration Parameters:**

- Addresses Collection: Firestore collection in which addresses are stored.

- Google Address Validation API Key: API key for the Google Address Validation API. You can create an API key in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

**Cloud Functions:**

- **validateAddressTrigger:** Processes document changes in the specified Cloud Firestore collection, syncing them to custom claims in Firebase Auth users.

- **retryOnUnknownError:** Handles tasks from unknown address validation responses.

**APIs Used**:

- addressvalidation.googleapis.com (Reason: Allows the extension to validate addresses using the Address Validation API.)

**Access Required**:

This extension will operate with the following project IAM roles:

- datastore.user (Reason: Allows the extension to write sync information back to Firestore.)

