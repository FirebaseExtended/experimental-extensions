Use this extension to automatically update the latitude and longitude of an address, as well as the best driving time between two addresses, using the Google Maps API. 

It listens to specified fields in documents within a Firestore collection and updates the `latitude`, `longitude`, and `best driving time` as needed.

### Features

### Automatically retrieves latitude and longitude for an address.
This feature listens to Firestore document creation/updates and updates geolocation information accordingly when a valid `address` has been added/updated in a document.

To ensure best practices, if a document has been updated within the last 30 days, the extension will not update the geolocation information.

```js
admin.firestore().collection('address_book').add({
  address: '1600 Amphitheatre Parkway, Mountain View, CA',
})
```

### Calculates the best driving time between two addresses.
To calculate the best driving time between two destinations, the extension feature to Firestore document creation/updates and updates `bestDrivingTime` information based on the provided `origin` and `destination` addresses.

```js
admin.firestore().collection('address_book').add({
  origin: '1600 Amphitheatre Parkway, Mountain View, CA',
  destination: '85 10th Ave, New York, NY' 
})
```

### Supports exponential backoff for error handling.
The extension uses exponential backoff guidelines through Cloud Tasks to ensure that it will continue trying to update the document data for any task. Learn more about this feature.

You can read more about this feature [here](https://developers.google.com/maps/documentation/routes/web-service-best-practices#exponential-backoff)


### Additional setup
Before installing this extension, make sure that you've set up a Cloud Firestore database in your Firebase project.
A valid Google Maps API key is required as part of the extension installation process.

#### Billing
To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Google Maps API
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))