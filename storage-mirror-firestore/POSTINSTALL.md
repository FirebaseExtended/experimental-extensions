### See it in action

You can test out this extension right away:

1. Go to your [Cloud Storage dashboard](https://console.firebase.google.com/u/0/project/$%7Bparam:PROJECT_ID%7D/storage).
2. Upload a file to Cloud storage.
3. Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/$%7Bparam:PROJECT_ID%7D/database/firestore/data)
4. You can check to see that the corresponding Document was created under `${param:FIRESTORE_ROOT}`.

### Using the extension

Any changes made in Cloud Storage will be reflected in the Firestore mirror. Each delimited path prefix segment in the Object path
will be separated by `/${param:PREFIXES_SUBCOLLECTION_NAME}/` and the Object itself can be found in 
the `${param:ITEMS_SUBCOLLECTION_NAME}` in the Prefix Document representing the parent Prefix.

#### Path Mapping Example

For these Cloud Storage paths, Documents will be generated in the following paths in Firestore.

Configuration Parameters:
- Firestore Root: `${param:FIRESTORE_ROOT}`
- Items Subcollection Name: `${param:ITEMS_SUBCOLLECTION_NAME}}`
- Prefixes Subcollection Name: `/${param:PREFIXES_SUBCOLLECTION_NAME}/`

| Cloud Storage Path                | Firestore Document Path                                                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| gs://mybucket/root_photo.jpg      | doc(`${param:FIRESTORE_ROOT}`).collection(`${param:ITEMS_SUBCOLLECTION_NAME}}`).doc('root_photo.jpg')                                                                                                                                                                                             |
| gs://mybucket/2019/08/1/photo.jpg | doc(`${param:FIRESTORE_ROOT}`).collection(`/${param:PREFIXES_SUBCOLLECTION_NAME}/`).doc('2019') .collection(`/${param:PREFIXES_SUBCOLLECTION_NAME}/`).doc('08') .collection(`/${param:PREFIXES_SUBCOLLECTION_NAME}/`).doc('1') .collection(`${param:ITEMS_SUBCOLLECTION_NAME}}`).doc('photo.jpg') |

#### Firestore Query Example

An example of what a Firestore query on Cloud Storage metadata might look like is the following which queries the
Cloud Storage for the first 5 items ordered by file size.

```JavaScript
const itemsSnapshot = await firestore
            .collection('gcs-mirror/your-bucket.appspot.com/items')
            .orderBy('gcsMetadata.size')
            .limit(5)
```

### (Optional) Backfill

If you already have objects in GCS that should be mirrored to Firestore, you can use the backfill tool in the stress_test subdirectory. If you application default credentials are set up, you can just run `npm run-script start -- backfill` from that directory.

### (Optional) Cleaning Up Tombstones

You can find instructions on how to use the Tombstone Cleanup tool to clean up all the Firestore Documents corresponding
to deleted Objects [here](TODO: Tombstone tool url).

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
