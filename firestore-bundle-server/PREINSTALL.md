**IMPORTANT: This extension is part of the Firebase Alpha program. [Alpha extensions](https://accounts.google.com/AccountChooser?service=gerritcodereview&continue=https://dev-partners.googlesource.com/login/samples/firebase/extensions-alpha/) are confidential, and their functionality might change in backward-incompatible ways before official, public release. We do not recommend installing Alpha extensions in production apps.**

Use this extension to build Firestore Bundle files via HTTP requests to a Cloud Function instance, and manage the caching strategy for the built bundle files.

#### How it works

The extension sets up a Cloud Function instance serving HTTP requests. The Function instance listens to a specified Firestore collection, whose documents are
specifications of Firestore Bundle files.

The clients send HTTP requests specifying what bundle specification to build, along with what values (via HTTP request query) to parameterize the specifications.

Depending on the bundle specification, the requested bundle might be returned from client's cache, Firebase Hosting cache or a Cloud Storage file.
When no cache is found, queries will run against Firestore to get the data and build the bundle.

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
