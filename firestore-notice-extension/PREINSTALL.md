Use this extension to provides an API for adding new ackowledgement notices, retrieving the latest notices, and tracking acknowledgements.

Allows users to acknowledge notices as part of their application. Ackowledgement forms include notice and cookie ackowledgement.

## Usage

The extension supports multiple use cases:

- Accepting notices
- Creating notices
- Getting notices
- Getting accepted notices

All functions `require authentication` to run, ensure you have a valud Firebase User included in your POST requests.

Managed documents are stored in a specified Cloud Firestore collection, while providing two subcollections for accesing data, these are:

- acknowledgements
- agreements

Each collection has a managed section for supporting multiple instances of the extension. For example, a typical routes for agreements would be:

`agreement/${EXT_ID}/{agreementId}`

## Definitions

`noticeId`: Notice Id. This unique Id represents a created notice firestore document.

`link`: An external http link for a user to view the associated notice terms and conditions.

`creationDate`: Automatically generated date value on creation of a new notices document.

`allowList`: A list of users emails or phone numbers. If specified, this will validate to ensure only selected users can accept the specified notices.

`noticeType`: A key/value list of unique properties for the notices Firestore document. An example, would be to add unique roles such as `publisher/consumer`

## Auth claims (optional)

By default, all accepted documents are stored under the `acknowledgements/{UID}` sub collection. Any lookups return the relavant Firestore documents.

If you would like to store the accepted documents on the Firebase User as auth claims, this can be configured by enabling the `Include Authentication Claims` in the Extension configuration.

Please note:

- Claims can be easily overriden by the Firebase sdk, for example through another function or script ran on the user.

- Custom claims are limited to 1000 bytes and may therfore be limited on how claims can be stored. This would also depend on exisitng claims data that exists for the user.

### Additional setup

Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

#### Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Ackowledgement documents collection: What is the path to the collection that contains the documents used to manage all ackowledgement documents?

**Cloud Functions:**

- **acknowledgeNotice:** Callable function for user to accept current notices.

- **createNotices:** Callable function to create a new notices of service agreement. This function can be used to implement admin tooling.

- **getNotices:** Callable function to get the current notices.

- **getAcknowledgements:** Callable function to get acknowledgements.

**Access Required**:

This extension will operate with the following project IAM roles:

- datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added ackowledgement related documents.)
