The Places Autocomplete Extension enhances your Firebase project by enabling real-time address suggestions for your Firestore documents. 

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

