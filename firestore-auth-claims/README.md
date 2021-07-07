# Set Auth claims with Firestore

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Set custom claims for Firebase Auth users from values set in Firestore.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/firestore-auth-claims)

### Firebase CLI

```bash
firebase ext:install firebase/firestore-auth-claims --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: This extension will automatically sync data from the specified collection to custom claims on a corresponding Firebase Auth user. For example, if I have a user with a UID of `abc123` I could use the Firestore SDK to set custom claims like so:

```js
db.collection("user_claims")
  .doc("abc123")
  .set({
    role: "admin",
    groups: ["example1", "example2"],
  });
```

Once the document has been written, the extension will automatically set the same custom claims (in this case, `role` and `groups`) on the Firebase Auth user with a UID corresponding to the document ID.

# Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

<!-- List all products the extension interacts with -->

- Cloud Functions
- Cloud Firestore

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

**Configuration Parameters:**

- Claims Collection: Firestore collection in which custom claims are stored. Must use Firebase Auth UIDs as document IDs.

- Claims Field: The document field in which custom claims are stored. Leave blank to use all document data as custom claims. Custom claims must be an object.

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

**Cloud Functions:**

- **sync:** Processes document changes in the specified Cloud Firestore collection, syncing them to custom claims in Firebase Auth users.

**Access Required**:

This extension will operate with the following project IAM roles:

- firebaseauth.admin (Reason: Allows the extension to set custom claims on Firebase Auth users.)

- datastore.user (Reason: Allows the extension to write sync information back to Firestore.)

