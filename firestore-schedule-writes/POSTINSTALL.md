Schedule Firestore Writes allows you to write data to a collection in Firestore that is then written to a different location at a specified time in the future. This can be used for many common time-related tasks such as delayed notifications, alarms, and reminders. Because this all happens within Firestore, scheduled writes can be listened to by clients or connected with via Cloud Functions.

# See it in action

```js
const TEN_MINUTES_MS = 10 * 60 * 1000;

firebase
  .firestore()
  .collection("${param:QUEUE_COLLECTION}")
  .add({
    state: "PENDING", // IMPORTANT! Omitting this field will prevent the scheduled write from being picked up.
    collection: "delivered", // only if you didn't specify a TARGET_COLLECTION
    data: { message: "Hello from the future!" },
    deliverTime: firebase.firestore.Timestamp.fromMillis(
      Date.now() + TEN_MINUTES_MS
    ),
  });
```

## Required Setup

To use this extension, Firestore must have a two compound indexes in the `${param:QUEUE_COLLECTION}` collection. These can be created manually in the Firebase console or added to your `firestore.indexes.json` file deployed via Firebase CLI:

```js
{
  "indexes": [
    {
      "collectionGroup": "${param:QUEUE_COLLECTION}",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "state", "order": "ASCENDING" },
        { "fieldPath": "deliverTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "${param:QUEUE_COLLECTION}",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "state", "order": "ASCENDING" },
        { "fieldPath": "leaseExpireTime", "order": "ASCENDING" }
      ]
    }
  ]
}
```

# Using the extension

When writing to your `${param:QUEUE_COLLECTION}` collection, the following fields are available:

- **state:** _Required._ Must be set to `"PENDING"` for the scheduled write to be picked up.
- **deliverTime:** _Required._ A [Firestore Timestamp](https://firebase.google.com/docs/reference/node/firebase.firestore.Timestamp) indicating the earliest time the write should be delivered. Note that delivery time is dependent on your installation settings and deliveries are processed at most once per minute.
- **data:** _Required._ The contents of the document you want to be written at the scheduled time.
- **collection:** The collection in which the scheduled document should be written. Ignored if you set a target collection at installation time.
- **id:** The document ID for the scheduled write. Omit this field to use a standard auto-generated document id.
- **serverTimestampFields:** An array of fields that should be populated with the server timestamp when the scheduled write occurs. For instance, `["createTime"]` would insert a server timestamp in the `createTime` field of the docuemnt.
- **invalidAfterTime:** A Firestore timestamp after which this write should _not_ be delivered even if successfully processed. If a problem prevents processing of queued writes, this field can be used to protect against outdated / stale writes being delivered once processing resumes.

The `state` field will update to `PROCESSING` and then one of `DELIVERED` (if cleanup policy keeps after processing) or `ERROR` if an error has occurred. For `ERROR` state documents, an `error` field will be populated with specific information about any delivery problems that occurred.

# Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
