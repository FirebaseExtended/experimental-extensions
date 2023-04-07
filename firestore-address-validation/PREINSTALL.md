The Address Validation Extension enhances your Firebase project by validating and standardizing addresses in your Firestore documents in real-time.

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