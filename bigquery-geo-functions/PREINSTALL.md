The BigQuery Geocode Extension enables you to use Google Maps API to obtain geolocation information such as `latitude`, `longitude`, and `driving time` between two addresses directly within your `BigQuery instance`. 

This extension comprises Cloud Functions that interact with the Google Maps API and creates BigQuery custom functions.


### Retrieve latitude and longitude for an address

This extension provides a custom BigQuery function latLong() that takes an address as input and returns the latitude and longitude of the address using the Google Maps API.

### Calculate the best driving time between two addresses

The extension includes another custom BigQuery function drivingTime() that accepts origin and destination addresses as inputs and returns the best driving time between the two locations.

### BigQuery connection

The extension automatically sets up a connection between BigQuery and the Google Maps API using the provided Service Account credentials.

## Pre-requisites

1. *BigQuery dataset*: You'll need a BigQuery dataset to use with the extension. You can either create a new dataset or use an existing one. Remember to provide the dataset ID during the extension installation.

2. *Google Maps API key*: Enable the Google Maps API for your project and obtain an API key. Follow the instructions provided in the Google Maps API documentation to set up your API key.

### Additional Setup
Before installing this extension, make sure that you've set up a BigQuery instance in your Google Cloud Platform project. A valid Google Maps API key is required as part of the extension installation process.

#### Billing
To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Google Maps API
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))