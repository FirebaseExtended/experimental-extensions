# BigQuery Geo Functions

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: TODO

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/bigquery-geo-functions)

### Firebase CLI

```bash
firebase ext:install firebase/bigquery-geo-functions --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: The BigQuery Geocode Extension enables you to use Google Maps API to obtain geolocation information such as `latitude`, `longitude`, and `driving time` between two addresses directly within your `BigQuery instance`.

This extension comprises Cloud Functions that interact with the Google Maps API and creates BigQuery custom functions.

### Retrieve latitude and longitude for an address

This extension provides a custom BigQuery function latLong() that takes an address as input and returns the latitude and longitude of the address using the Google Maps API.

### Calculate the best driving time between two addresses

The extension includes another custom BigQuery function drivingTime() that accepts origin and destination addresses as inputs and returns the best driving time between the two locations.

### BigQuery connection

The extension automatically sets up a connection between BigQuery and the Google Maps API using the provided Service Account credentials.

## Pre-requisites

1. _BigQuery dataset_: You'll need a BigQuery dataset to use with the extension. You can either create a new dataset or use an existing one. Remember to provide the dataset ID during the extension installation.

2. _Google Maps API key_: Enable the Google Maps API for your project and obtain an API key. Follow the instructions provided in the Google Maps API documentation to set up your API key.

### Additional Setup

Before installing this extension, make sure that you've set up a BigQuery instance in your Google Cloud Platform project. A valid Google Maps API key is required as part of the extension installation process.

#### Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Google Maps API
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))

**Configuration Parameters:**

- BigQuery Dataset ID: The ID of the dataset where the extension will create a connection.

- Maps API key: The key to use for the Maps API. You can get a key from the [Google Cloud](https://console.cloud.google.com/google/maps-apis/overview).

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

**Cloud Functions:**

- **createBigQueryConnection:** Creates a BigQuery connection

- **getLatLong:** TODO

- **getDrivingTime:** TODO

**APIs Used**:

- bigquery.googleapis.com (Reason: Powers all BigQuery tasks performed by the extension)

- bigqueryconnection.googleapis.com (Reason: Allows the extension to create a BigQuery connection)

- geocoding-backend.googleapis.com (Reason: Allows the extension to get information such as latiutude and longitue from addresses)

- distance-matrix-backend.googleapis.com (Reason: Allows the extension to calculate driving times between two addresses)

**Access Required**:

This extension will operate with the following project IAM roles:

- bigquery.jobUser (Reason: Allows the extension to create BigQuery jobs)

- bigquery.dataOwner (Reason: Allows the extension to create BigQuery routines)

- bigquery.connectionAdmin (Reason: Allows the extension to create a BigQuery connection)

