Use this extension to build Firestore data bundle files via HTTP requests to a Cloud Function instance, and manage the caching strategy for the built bundle files. Firestore data bundles are static data files built from Firestore documents and query snapshots;
learn more about Firestore data bundles in the [Firestore guides](https://firebase.google.com/docs/firestore/bundles).

#### How it works

The extension sets up a Cloud Function instance serving HTTP requests. The Function instance listens to a specified Firestore collection, whose documents are
specifications for assembly of Firestore data bundle files.

Clients send HTTP requests specifying what bundle specification to build, along with values (via HTTP request query parameters) to parameterize the
specifications.

Depending on the bundle specification, the requested bundle might be returned from client's cache, Firebase Hosting cache or a Cloud Storage file. When no
cache is found, queries will run against the Firestore back-end to get the data and build the bundle.

#### Additional setup

Before installing this extension, you'll need to set up these services in your Firebase project:

- [Set up Cloud Firestore](https://firebase.google.com/docs/firestore/quickstart)
- [Set up Cloud Functions](https://firebase.google.com/docs/functions)

#### Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

- Cloud Firestore
- Cloud Functions
- Cloud Storage

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)
