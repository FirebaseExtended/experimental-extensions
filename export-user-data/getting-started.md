# Usage

## Using the extension

The extension uses multiple mechanisms to find data to be exported.

## By path

When configuring the Cloud Firestore, Realtime Database & Cloud Storage paths in the configuration, it’s possible to define a `UID` variable in the paths which will be replaced with the authenticated users UID. When the `exportUserData` callable function is called from an authenticated client, the extension will start to export data from the given paths, for example:

- Cloud Firestore path(s): `users/{UID},movies`
- Realtime Database path(s): `likes/{UID}`
- Cloud Storage path(s): `{DEFAULT}/uploads/{UID},{DEFAULT}/avatars/{UID}.jpeg`

Be aware of the following behavioral differences between each service:

- Firestore: if a document path is specified, a single CSV file for that document will be created. If a collection path is specified, a single CSV file containing all document data for that collection will be created.
- Realtime Database: all data at the specified node will be exported to a single CSV per specified path.
- Storage: if a file path is specified, the single file will be exported (copied). If a directory path is specified, all files within that directory will be exported.

## Custom function hook

For cases where data discovery requires complex queries to identify, it is possible to define a custom function hook URL. The function that accepts a UID should return an object containing Firestore, Realtime Database and/or Storage paths to export. For example:

```js
export const getCustomExportPaths = functions.https.onRequest(
  async (req, res) => {
    const uid = req.body.uid;

    // Perform custom query

    return {
      firestorePaths: [‘/document/path’],
      databasePaths: [‘path/to/node’],
      storagePaths: [‘/storage/path’],
    };
  });
```

## Archiving exported data

By default the extension will generate a list of CSV files. If you wish to additionally export a single zip archive containing all files, set the `Zip’ configuration option to true.

**Note: Archiving is resource intensive and you may run into resource limitations with large volumes of exported data.**

To manually export the data into an archive, the following code snippet can be used on a NodeJS environment using the archiver package:

```js
const admin = require("firebase-admin");
const archiver = require("archiver");
const fs = require("fs");

function zipDirectory(storagePath, bucketName, outPath) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);
  archive.pipe(stream);

  return new Promise((resolve, reject) => {
    admin
      .storage(bucketName)
      .getFiles({
        prefix: storagePath,
      })
      .then((files) => {
        files.forEach((file) => {
          archive.append(file.createReadStream(), { name: file.name });
        });
        archive.finalize();
      });

    stream.on("close", () => resolve(false));
  });
}
```

## Firestore Security rules

To enable your clients to read the export document, add the following security rules to match the user’s UID with the document uid:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /exports/{exportId} {
    	allow read: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
```

If you initialized Firestore in production mode, your rules will be configured by default such that no clients can read the export document. If you created Firestore in test mode, your rules will be configured by default such that all clients can read the export document.

## Storage Security rules

By default, security rules will prevent any client reads to exported files. To allow such reads, security rules can be set up so that access is only granted when the user’s UID matches the UID field of the export record document, for example:

```
rules_version = '2';
service firebase.storage {
match /b/{bucket}/o {
match /${param:FIRESTORE_EXPORTS_COLLECTION}/{exportId}/{allPaths=**} {
      allow read: if firestore.exists(/databases/(default)/documents/${param:FIRESTORE_EXPORTS_COLLECTION}/$(exportId))
        && (request.auth != null && firestore.get(/databases/(default)/documents/${param:FIRESTORE_EXPORTS_COLLECTION}/$(exportId)).data.uid == request.auth.uid)
}
}
```

## Client SDK Usage

The extension requires an authenticated user to call the `exportUserData` callable function. The function returns a unique export ID which can be used to subscribe to a Firestore document within the `${param:FIRESTORE_EXPORTS_COLLECTION}` collection. The document contains the real time status of an export, containing a `status` property. See the reference API for full details.

Note: The following code requires that security rules have been added to the project.

The following code snippet could be used to trigger an export and list out all files that have been exported once complete:

```js
import { getFirestore(), doc, onSnapshot } from 'firebase/firestore';
import { getStorage, listAll, ref } from 'firebase/storage';


// Trigger the export.
const result = await httpsCallable(functions, `ext-${param:EXT_INSTANCE_ID}-exportUserData`)();

// Get the returned export id.
const exportId = result.data.exportId;

 // Make a Firestore reference to the export.
 const documentRef = doc(getFirestore(), '${param:FIRESTORE_EXPORTS_COLLECTION}', exportId);

// Listen for changes to the export - when complete returned the storage path of the export items.
const { storagePath, zipPath } = await new Promise<string>((resolve, reject) => {
    const unsubscribe = onSnapshot(documentRef, snapshot => {
    if (!snapshot.exists) {
      unsubscribe();
      return reject(new Error("Export document not found"));
    }

    const data = snapshot.data()!;

    if (data.status === 'complete') {
      unsubscribe();
      return resolve({
        storagePath: data.storagePath,
        zipPath: data.zipPath,
      });
    }
  });
});

// Get a list of all the files in the export.
const listResult = await listAll(ref(getStorage(), storagePath));

// Log out all exported file paths
listResults.forEach((result) => {
  console.log(result.fullPath);
});
```

To generate download links for the client, use the `getDownloadURL` function using a export files path:

```js
import { listAll, ref, getDownloadURL } from "firebase/storage";

const url = await getDownloadURL(ref(getStorage(), fullPath));
```

## Sending an export email

To send an email to your users once an export has completed with the export, you can deploy a [Custom Event Trigger](https://firebase.google.com/docs/functions/beta/custom-events). Listen to the completed export event, and send an email with the export as an attachment, for example using [nodemailer](https://nodemailer.com/).

Monitoring
As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
