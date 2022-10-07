### See it in action

You can test out this extension right away:

1. Go to your [Cloud Storage dashboard](https://console.firebase.google.com/u/0/project/${param:PROJECT_ID}/storage).
2. Upload a file to Cloud storage.
3. Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/database/firestore/data)
4. You can check to see that the corresponding Document was created under `${param:FIRESTORE_ROOT}`.

### Using the extension

Any changes made in Cloud Storage will be reflected in the Firestore mirror. Each delimited path prefix segment in the Object path
will be separated by `/${param:PREFIXES_SUBCOLLECTION_NAME}/` and the Object itself can be found in
the `${param:ITEMS_SUBCOLLECTION_NAME}` in the Prefix Document representing the parent Prefix.

#### Path Mapping Example

For these Cloud Storage paths, Documents will be generated in the following paths in Firestore.

Configuration Parameters:
- Firestore Root: `${param:FIRESTORE_ROOT}`
- Items Subcollection Name: `${param:ITEMS_SUBCOLLECTION_NAME}`
- Prefixes Subcollection Name: `/${param:PREFIXES_SUBCOLLECTION_NAME}/`

gs://mybucket/root_photo.jpg:

```JavaScript
doc(`${param:FIRESTORE_ROOT}`)
  .collection(`${param:ITEMS_SUBCOLLECTION_NAME}`)
  .doc("root_photo.jpg");
```

gs://mybucket/2019/08/1/photo.jpg:

```JavaScript
doc(`${param:FIRESTORE_ROOT}`)
  .collection(`/${param:PREFIXES_SUBCOLLECTION_NAME}/`)
  .doc("2019")
  .collection(`/${param:PREFIXES_SUBCOLLECTION_NAME}/`)
  .doc("08")
  .collection(`/${param:PREFIXES_SUBCOLLECTION_NAME}/`)
  .doc("1")
  .collection(`${param:ITEMS_SUBCOLLECTION_NAME}').doc('photo.jpg`);
```

#### Firestore Query Example

An example of what a Firestore query on Cloud Storage metadata might look like is the following which queries the
Cloud Storage for the first 5 items ordered by file size.

```JavaScript
const itemsSnapshot = await firestore
            .collection('${param:FIRESTORE_ROOT}/${param:ITEMS_SUBCOLLECTION_NAME}')
            .orderBy('gcsMetadata.size')
            .limit(5)
```

## Scripts (Optional)

This project includes a number of utilities that can be ran from a terminal on your local machine.

If you already have objects in GCS that should be mirrored to Firestore, you can use the backfill tool in the stress_test subdirectory. If your application default credentials are set up, you can just run `npm run-script start -- backfill` from that directory.

To access these utilities, please [clone](https://www.npmjs.com/org/firebaseextensions) or run via `npx @firebaseextensions/storage-mirror-firestore-utilities`

If application default credentials are set up, you can simply run the scripts below.

Otherwise, please see [Application Default Credentials](https://cloud.google.com/docs/authentication/production) to setup your local environment.

### Backfill

If you already have objects in GCS that should be mirrored to Firestore, you can use the backfill tool in the storage-mirror-firestore-stress-test package.

To run this function you can just run `npm run-script start -- backfill` from that directory

### Cleaning Up Tombstones

If you want to cleanup tombstone records, you can use the cleanup tool in the stress_test subdirectory. If your application default credentials are set up, you can just run `npm run-script start -- clean-tombstones` from that directory. You can optionally also specify the
`--instance-id <extension_instance_id>` and `--project <project_id>` params for this script.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
