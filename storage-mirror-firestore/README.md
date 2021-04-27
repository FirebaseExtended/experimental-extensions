# Store links to GCS files in Firestore

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Writes Firestore Documents for GCS Objects with it's Metadata as Document fields.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/storage-mirror-firestore)

### Firebase CLI

```bash
firebase ext:install firebase/storage-mirror-firestore --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: Use this extension to store the locations and metadata for Cloud Storage Objects in your Firestore database in real-time.

When you Create, Update, Delete, or Archive an Object in your configured Cloud Storage Bucket, this extension will update the configured
Firestore location to maintain a mirror that reflects the contents of Cloud Storage in real-time.

Clients can subscribe to this Mirror in Firestore to get real-time updates as Objects are modified in your Bucket. Firestore Queries
can be performed using metadata fields that are copied over in order to filter for specific Objects.

For every Object or Folder in Cloud Storage, there should be one Document created in Firestore with the Object's metadata stored as Document fields.

#### Things you should know

- The mirroring process only happens when new changes in Cloud Storage trigger the extension. This means that the extension
  WILL NOT back-fill any data that existed before it was installed or if there are any service outages. In order to back-fill/repair
  your Firestore mirror, please use the back-fill tool provided in the stress-test directory (`npm run-script start -- backfill`)
- Please note that this Mirror is one-way (changes made in Firestore will not show up in Cloud Storage), and the contents
  should be treated as read-only. This is because the entire Document is replaced during an update and any changes will be
  overwritten. Also note that any Documents where the extension fields have been removed will be treated as non-existent.
- Firestore has some Document naming [restrictions](https://firebase.google.com/docs/firestore/quotas#collections_documents_and_fields).
  Because this extension will mirror the path of the Cloud Storage Object, the generated Firestore path may be longer than
  the maximum subcollection depth of 100 and so there is a limit on the number of delimiters in the name of Objects you intend to mirror.
  There is also a limit of 1 megabyte for Document size, this will not be a problem for regular Objects with no custom metadata
  but keep it in mind if you are intending to mirror custom metadata.
- When Objects are deleted from Cloud Storage, the mirrored equivalent in Firestore will also be deleted. However, since the extension
  needs to keep track of the last time it updated the Document, it will create a "Tombstone" document that can be found in the configured
  subcollection, this Tombstone Document contains only the `lastEvent` field used by the extension to keep track of it's most recent
  update.
- The extension will maintain all the active Prefixes by creating and deleting Prefix Documents representing paths that
  contain Objects within Cloud Storage. In effect, this means file-system-like traversal is possible where each Prefix
  Document acts like a directory and has nested sub-directories both of which may or may not contain files. When creating or updating
  Objects, the relevant Prefix Documents will be created, and when deleting or archiving Objects, the relevant Prefix Documents
  will be checked for deletion.
- Although we describe the extension as being real-time, due to limitations related to Cloud Functions there may be a noticeable
  delay between updates to Cloud Storage and these updates showing up in Firestore depending on what your use-case looks like.
  Due to the cold-start time for Cloud Functions, there may be a delay when running a Cloud Storage operation after a long period
  of inactivity due to the function having to initialize. Because there is a limit to the number of concurrent running invocations
  of a function, there may be a delay when there is high load causing many function invocations to happen concurrently.
- Note that the extension will mirror all metadata fields by default. This includes the custom metadata field for download tokens,
  which give read access. This means anyone with read access to a Firestore document will have read access to the GCS object it
  represents. You can disable this by setting the Custom Metadata Filter to `^(?!firebaseStorageDownloadTokens).*`.
- Although Cloud Storage stores Object metadata as string fields, this extension converts applicable fields to `Number` or `Timestamp`
  Firestore types like `size` or `updated` in order to enable querying.

#### Document Data

Documents created representing Objects will have the following fields:

- A `lastEvent` field used by the extension to determine when the Document was last changed by the extension.
- A `gcsMetadata` field that contains the [metadata](https://cloud.google.com/storage/docs/metadata) stored in Cloud Storage.
  - The following fields are converted to `Number` in Firestore: `size`, `generation`, `metageneration`
  - The following fields are converted to `Timestamp` in Firestore: `timeCreated`, `updated`, `timeStorageClassUpdated`

Documents created representing Prefixes will have the following fields:

- A `lastEvent` field like above.
- A `childRef` field that is used by the extension to determine whether the Prefix Document should be checked for deletion.

Documents created representing Tombstones for deleted Objects or Prefixes that have become empty will have the following fields:

- A `lastEvent` field like above.

#### Additional Setup

- [Set up Cloud Firestore in your Firebase project.](https://firebase.google.com/docs/firestore/quickstart)
- [Set up Cloud Storage in your Firebase project.](https://firebase.google.com/docs/storage)

#### Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

- Cloud Firestore
- Cloud Storage
- Cloud Functions

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing).

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Cloud Storage bucket to mirror: Which Cloud Storage bucket should we mirror?

- Root Document path: What is the path to the collection where documents references should be stored?

- Items Subcollection Name: What should we call subcollections representing GCS Objects?

- Item Tombstones Subcollection Name: What should we call subcollections representing deleted GCS Objects?

- Prefixes Subcollection Name: What should we call subcollections representing Object Prefixes?

- Prefix Tombstones Subcollection Name: What should we call subcollections representing deleted Object Prefixes?

- Custom Metadata Field filter: Regex describing which custom metadata fields should be mirrored.

- Metadata Field filter: Regex describing which object metadata fields should be mirrored.

- Object Name filter: Regex describing which objects should be mirrored.

**Cloud Functions:**

- **mirrorObjectPathHttp:** Mirrors the GCS state of an object path to Firestore.

- **mirrorFinalize:** Listens for changes in your specified Cloud Storage bucket, and updates Firestore appropriately.

- **mirrorDelete:** Listens for changes in your specified Cloud Storage bucket, and updates Firestore appropriately.

- **mirrorArchive:** Listens for changes in your specified Cloud Storage bucket, and updates Firestore appropriately.

- **mirrorMetadataUpdate:** Listens for changes in your specified Cloud Storage bucket, and updates Firestore appropriately.

**APIs Used**:

- storage-component.googleapis.com (Reason: Needed to use Cloud Storage)

- firestore.googleapis.com (Reason: Needed to use Cloud Firestore)

**Access Required**:

This extension will operate with the following project IAM roles:

- storage.objectViewer (Reason: Allows the extension to read from Cloud Storage.)

- datastore.user (Reason: Allows the extension to read & write to Cloud Firestore.)

