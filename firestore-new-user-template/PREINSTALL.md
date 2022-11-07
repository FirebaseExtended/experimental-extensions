Use this extension to create user document keyed in userID using a preset template when a new user created in Auth.

### How this extension works

Use this extension to automatically generate a user document when a new user created in [Firebase Authentication](https://firebase.google.com/docs/auth).

The new user document will be keyed in userID that referenced in Auth, and the document data will be organized based on the pre-set template document.

Note: To use this extension, you need to manage your user scores using Firestore. The documents in this collection must contain fields representing score and keyed by user id.

### Additional setup
Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

Make sure that you've set up [Firebase Authentication](https://firebase.google.com/docs/auth) to manage your users.

#### Billing
To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))
