# Firestore Places Autocomplete

**Author**: undefined

**Description**: This extension provides a simple way to add autocomplete functionality to your Firestore database. It uses the Google Places API to provide autocomplete suggestions for a given query.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/firestore-places-autocomplete)

### Firebase CLI

```bash
firebase ext:install firebase/firestore-places-autocomplete --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: The Places Autocomplete Extension enhances your Firebase project by enabling real-time address suggestions for your Firestore documents.

The extension leverages Google Maps Places API's Autocomplete feature to automatically provide address predictions when new documents are created or updated in the specified Firestore collection.

### Real-time address suggestions

Automatically fetch address predictions from Google Maps Places API when new documents are added or updated.

### Firestore integration

Seamlessly integrates with your Firestore collection to store address predictions in your documents.

### Configurable collection

Specify the collection you want the extension to monitor for updates and new documents.

### Pre-requisites

Ensure you have a Firestore collection set up in your Firebase project. This collection will be monitored by the extension to fetch address predictions. Provide the collection ID during the extension installation.

### Additional Setup

Before installing this extension, make sure that you've `enabled` the `Google Maps Places API` for your project and obtained an `API key`.

Follow the instructions provided in the Google Maps API documentation to set up your API key.

#### Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Places API
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))

**Configuration Parameters:**

- Google Places API key: The API key used to access the Google Places API. You can create a new API key in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

- Collection path: The path to the collection that will be watched for place queries.

- Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

**Cloud Functions:**

- **autocomplete:** HTTP request-triggered function that responds with a specified greeting message

**APIs Used**:

- places-backend.googleapis.com (Reason: This extension requires access to the Google Places API to provide autocomplete suggestions.)

**Access Required**:

This extension will operate with the following project IAM roles:

- datastore.user (Reason: Allows the extension to write translated strings to Cloud Firestore.)

