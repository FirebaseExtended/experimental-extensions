# Export User Data

**Author**: undefined

**Description**: Export certain data keyed on a user ID from Firestore, Realtime Database, or Cloud Storage to a Google Cloud Storage bucket.

**Details**: Use this extension to export certain data to Cloud Storage from Cloud Firestore, Realtime Database or Cloud Storage.

This extension exports certain data keyed to a given user ID from Firebase Authentication. Data is exported as individual files (one file per Firestore collection or doc depending on which the path pointed to, one per node in RTDB, and one per file in Cloud Storage) to a Cloud Storage directory. Alternatively, the extension can be configured to combine all exported files into a single zip archive. This extension will only export data that it is explicitly configured to delete.

Note: To use this extension, you need to manage your users with Firebase Authentication.

**This extension may be useful in helping you respect user privacy and fulfill compliance requirements you may be subject to. However, you are responsible for assessing and determining your compliance needs and obligations, and using this extension does not guarantee compliance with government and industry regulations.**

## Additional setup

Make sure you’ve set up Cloud Storage in your Firebase project, as this is where data will be exported to. Depending on where you'd like to export data from, make sure that you've set up [Cloud Firestore](https://firebase.google.com/docs/firestore) and/or [Realtime Database](https://firebase.google.com/docs/database) in your Firebase project before installing this extension.

Also, make sure that you've set up Firebase Authentication to manage your users.

## Billing

To install an extension, your project must be on the Blaze (pay as you go) plan

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Firestore
  - Firebase Realtime Database
  - Cloud Storage
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))

**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Cloud Storage bucket for exports: To which Cloud Storage bucket will you export your data? It is recommended to create a separate bucket for this extension. For more information, refer to the [pre-installation guide](https://firebase.google.com/products/extensions/storage-resize-images).


* Folder for storing exported data: To which Cloud Storage folder will you upload exported data?


* Firestore collection to record export metadata: What is the path to the collection that will contain the export tracking documents?


* Cloud Firestore paths: Which paths in your Cloud Firestore instance contain data keyed by User ID? Leave empty if you don't use Cloud Firestore. Enter the full paths, separated by commas. You can represent the User ID of the user with `{UID}`. For example, if you have the collections `users` and `admins`, and each collection has documents with User ID as document IDs, then you can enter `users/{UID},admins/{UID}`.

* Realtime Database instance: From which Realtime Database instance do you want to export data keyed by User ID? If this parameter is not specified, this extension will use your default database instance.


* Realtime Database location: (Only applicable if you provided the `Realtime Database instance` parameter.) From which Realtime Database location do you want to export data keyed by User ID?


* Realtime Database paths: Which paths in your Realtime Database instance contain data keyed by User ID? Leave empty if you don't use Realtime Database. Enter the full paths, separated by commas. You can represent the User ID of the exported user with `{UID}`. For example: `users/{UID},admins/{UID}`.

* Cloud Storage paths: Where in Google Cloud Storage do you store data keyed by User ID? Leave empty if you don't use Cloud Storage. Enter the full paths to files or directories in your Storage buckets, separated by commas. Use `{UID}` to represent the User ID of the user whose data we're exporting, and use `{DEFAULT}` to represent your default Storage bucket. Here's a series of examples. To export all the files in your default bucket with the file naming scheme `{UID}-pic.png`, enter `{DEFAULT}/{UID}-pic.png`. To also export all the files in another bucket called my-app-logs with the file naming scheme `{UID}-logs.txt`, enter `{DEFAULT}/{UID}-pic.png,my-app-logs/{UID}-logs.txt`. To *also* export a User ID-labeled directory and all its files (like `media/{UID}`), enter `{DEFAULT}/{UID}-pic.png,my-app-logs/{UID}-logs.txt,{DEFAULT}/media/{UID}`.

* Custom hook endpoint: Specify a function URL to call that will return an object listing paths in services to export data from. See the pre-install documentation for more details.

* Enable Zipping of Exports: If enabled, will compress all exports into one zip file in storage.


**Cloud Functions:**

* **exportUserData:** Triggers an export and returns a unique export ID.


**Access Required**:

This extension will operate with the following project IAM roles:

* datastore.owner (Reason: Allows the extension to export (user) data from Cloud Firestore.)

* firebasedatabase.admin (Reason: Allows the extension to export (user) data from Realtime Database.)

* storage.admin (Reason: Allows the extension to export (user) data from Cloud Storage.)
