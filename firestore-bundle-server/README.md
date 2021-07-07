# Firestore Bundle Server

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Provides cached serving of Firestore bundles.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/firestore-bundle-server)

### Firebase CLI

```bash
firebase ext:install firebase/firestore-bundle-server --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: Use this extension to build Firestore data bundle files via HTTP requests to a Cloud Function instance, and manage the caching strategy for the built bundle files. Firestore data bundles are static data files built from Firestore documents and query snapshots;
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

**Configuration Parameters:**

- Collection to store bundle specification documents: Path to the Firestore collection whose documents are specifications of bundles the extension will build.

- Google Cloud Storage bucket to save the built bundle files: The Cloud Storage bucket to save the built bundle files. This applies when the bundle specification has `fileCache` enabled.

- Prefix to use for bundle files saved in Google Cloud Storage.: The prefix for all the bundle files built and saved in Cloud Storage. This applies when the bundle specification has `fileCache` enabled.

**Cloud Functions:**

- **serve:** HTTPS function that serves bundled content from Cloud Storage cache or by dynamically building.

**Access Required**:

This extension will operate with the following project IAM roles:

- datastore.user (Reason: Allows the extension to read configuration and build bundles from Firestore.)

- storage.objectAdmin (Reason: Allows the extension to save built bundles in Cloud Storage)

