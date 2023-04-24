# Firestore Geo Functions

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Provides location based utilities, adding positional infornmation to addresses and calculating distances betweem two locations.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/firestore-geo-functions)

### Firebase CLI

```bash
firebase ext:install firebase/firestore-geo-functions --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: Use this extension to automatically update the latitude and longitude of an address, as well as the best driving time between two addresses, using the Google Maps API.

It listens to specified fields in documents within a Firestore collection and updates the `latitude`, `longitude`, and `best driving time` as needed.

### Features

### Automatically retrieves latitude and longitude for an address.

This feature listens to Firestore document creation/updates and updates geolocation information accordingly when a valid `address` has been added/updated in a document.

To ensure best practices, if a document has been updated within the last 30 days, the extension will not update the geolocation information.

```js
admin.firestore().collection("address_book").add({
  address: "1600 Amphitheatre Parkway, Mountain View, CA",
});
```

### Calculates the best driving time between two addresses.

To calculate the best driving time between two destinations, the extension feature to Firestore document creation/updates and updates `bestDrivingTime` information based on the provided `origin` and `destination` addresses.

```js
admin.firestore().collection("address_book").add({
  origin: "1600 Amphitheatre Parkway, Mountain View, CA",
  destination: "85 10th Ave, New York, NY",
});
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

**Configuration Parameters:**

- Collection ID: The ID of the collection where the extension will listen for writes.

- Maps API key: The key to use for the Maps API. You can get a key from the [Google Cloud](https://console.cloud.google.com/google/maps-apis/overview).

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

**Cloud Functions:**

- **updateLatLong:** Update the longitue and latitude.

- **writeLatLong:** Listen for writes of addresses to a collection and writes back the latitude and longitude of that address to the same collection.

- **writeBestDrivingTime:** Listen for writes of addresses to a collection and writes back the best driving time in seconds.

**APIs Used**:

- geocoding-backend.googleapis.com (Reason: Allows the extension to get information such as latiutude and longitue from addresses)

- distance-matrix-backend.googleapis.com (Reason: Allows the extension to calculate driving times between two addresses)

**Access Required**:

This extension will operate with the following project IAM roles:

- datastore.user (Reason: Allows the extension to read and write to Cloud Firestore.)

