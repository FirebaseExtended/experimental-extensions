This extension makes it easy to add notices to your application that your users can acknowledge. The extension helps with:

- Storing/retrieving notices with versioning built in
- Marking notices with an acknowledgement type (including notice ID/version/timestamp recorded)
- Retrieving a historical log of which users have acknowledged which notices
- Collecting custom acknowledgement metadata (such as additional user preferences) for a notice 
- Allowing notices to be only acknowledged by a select group of users

You can see this extension in use on the [Kara’s Coffee demo application](https://karas-coffee.web.app/), or [view the source code](https://github.com/FirebaseExtended/karas-coffee).

## Usage

Notices and acknowledgements are stored as documents inside Firestore. You can define the collection those documents are contained during the installation process, when you set up the extension instance’s configuration parameters.

After installing, you can use our code samples to integrate the notice into your application. There are examples for acknowledging/unacknowledging notices and retrieving acknowledgments. These samples are provided after installation.

The extensions' source code contains a [web app providing admin utilities](https://github.com/FirebaseExtended/experimental-extensions/tree/%40invertase/firestore-tos-extension/firestore-notice-extension/admin-dashboard) that you can run locally. This contains a notice builder UI that you can use to easily create and customize notices.

Note: You must manage your users with Firebase Auth in order to use this extension. All acknowledgement records in Firestore created by this extension are associated with a Firebase Auth UID. 

### Additional setup

Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

Also, make sure that you've set up [Firebase Authentication](https://firebase.google.com/docs/auth) to manage your users.

#### Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))