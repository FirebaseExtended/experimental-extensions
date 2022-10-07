This extension makes it easy to add notices to your application that your users can acknowledge. The extension helps with:

- Storing/retrieving notices with versioning built in
- Marking notices with an acknowledgement type (including notice ID/version/timestamp recorded)
- Retrieving a historical log of which users have acknowledged which notices
- Collecting custom acknowledgement metadata (such as additional user preferences) for a notice 
- Allowing notices to be only acknowledged by a select group of users

You can see this extension in use on the [Kara’s Coffee demo application](https://karas-coffee.web.app/), or [view the source code](https://github.com/FirebaseExtended/karas-coffee).

#### Additional setup

Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

Also, make sure that you've set up [Firebase Authentication](https://firebase.google.com/docs/auth) to manage your users. All acknowledgement records in Firestore created by this extension are associated with a Firebase Auth UID. 

#### Getting Started

See the Getting Started page for detailed documentation on creating notices, and how to retrieve them and track acknowledgments from your app. An [API reference](REFERENCE.md) is available providing detailed information on the available interfaces and configuration this extension offers.

#### Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))
