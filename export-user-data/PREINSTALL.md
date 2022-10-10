Use this extension to export a user’s data to Cloud Storage from Cloud Firestore, Realtime Database or Cloud Storage.

This extension exports data keyed to the user's user ID from Firebase Authentication. Data is exported as individual files (one file per Firestore collection or doc depending on which the path pointed to, one per node in RTDB, and one per file in
storage) to a Cloud Storage directory. Alternatively, the extension can be configured to combine all exported files into a single zip archive.

Note: To use this extension, you need to manage your users with Firebase Authentication.

**This extension may be useful in helping you respect user privacy and fulfill compliance requirements you may be subject to. However, you are responsible for assessing and determining your compliance needs and obligations, and using this extension does not guarantee compliance with government and industry regulations.**

## Additional setup

Make sure you’ve set up [Cloud Storage](https://firebase.google.com/docs/storage) in your Firebase project, as this is where data will be exported to. Depending on where you'd like to export data from, make sure that you've set up [Cloud Firestore](https://firebase.google.com/docs/firestore) and/or [Realtime Database](https://firebase.google.com/docs/database) in your Firebase project before installing this extension.

Also, make sure that you've set up [Firebase Authentication](https://firebase.google.com/docs/auth) to manage your users.

## Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)
- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
    - Cloud Firestore
    - Firebase Realtime Database
    - Cloud Storage
    - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))