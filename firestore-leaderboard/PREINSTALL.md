Use this extension to create leaderboards for your game in Cloud Firestore collection.

### How this extension works

Use this extension to automatically generate a leaderboard from a Firestore scores collection containing score documents keyed by user ID. This extension will keep the leaderboard up to date as new scores come in, and when existing scores change. 

You can use this extension to generate global leaderboards, or segmented leaderboards. For example, you could manage game-level leaderboards, regional leaderboards, and even duration-based contest leaderboards all within this extension. All you need to do is decide on a custom name for each leaderboard and add those names to the scores document. More detailed instructions will be provided after installation.

The leaderboards themselves will be stored in Firestore under a collection path that you configure during installation.

This extension comes with a sample Unity project to demonstrate usage. The project shows off a Leaderboard component (with code snippet) connected to the extension, which you can use out-of-the-box or as a starting point for a custom Leaderboard UI. You can find the project [here](https://github.com/FirebaseExtended/experimental-extensions/tree/next/firestore-leaderboard/client) and follow the [instructions](https://github.com/FirebaseExtended/experimental-extensions/tree/next/firestore-leaderboard/client/README.md) to set up and run the demo.

Note: To use this extension, you need to manage your user scores using Firestore. The documents in this collection must contain fields representing score and keyed by user id.

### Additional setup
Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

#### Billing
To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))
