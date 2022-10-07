## See it in action

The first thing you’ll want to do is create a notice in Firestore. To do this, you can use the admin dashboard for this extension by running the following commands:

```bash
git clone git@github.com:FirebaseExtended/experimental-extensions.git
cd experimental-extensions/firestore-record-user-acknowledgements/admin-dashboard
npm install
npm run dev
```

Head over to the locally running application and create a new notice. View the dashboard [README](https://github.com/FirebaseExtended/experimental-extensions/blob/next/firestore-record-user-acknowledgements/admin-dashboard/README.md) for more information.

This extension requires a number of [Firestore indexes](https://firebase.google.com/docs/firestore/query-data/indexing) - to create these click each of the links and then press create on the opened Firebase Console window.

- Collection '${param:NOTICES_COLLECTION}': `type` Ascending, `version` Ascending, `createdAt` Descending
  - [Open Firebase Console](https://${param:LOCATION}-${param:PROJECT_ID}.cloudfunctions.net/ext-${param:EXT_INSTANCE_ID}-createIndex?collection=${param:NOTICES_COLLECTION}&queryScope=collection&fields=type,asc,version,asc,createdAt,desc)
- Collection '${param:NOTICES_COLLECTION}': `type` Ascending, `createdAt` Descending
  - [Open Firebase Console](https://${param:LOCATION}-${param:PROJECT_ID}.cloudfunctions.net/ext-${param:EXT_INSTANCE_ID}-createIndex?collection=${param:NOTICES_COLLECTION}&queryScope=collection&fields=type,asc,createdAt,desc)
- Collection '${param:ACKNOWLEDGEMENTS_COLLECTION}': `userId` Ascending, `createdAt` Descending
  - [Open Firebase Console](https://${param:LOCATION}-${param:PROJECT_ID}.cloudfunctions.net/ext-${param:EXT_INSTANCE_ID}-createIndex?collection=${param:ACKNOWLEDGEMENTS_COLLECTION}&queryScope=collection&fields=userId,asc,createdAt,desc)
- Collection group '${param:ACKNOWLEDGEMENTS_COLLECTION}': `userId` Ascending, `createdAt` Descending
  - [Open Firebase Console](https://${param:LOCATION}-${param:PROJECT_ID}.cloudfunctions.net/ext-${param:EXT_INSTANCE_ID}-createIndex?collection=${param:ACKNOWLEDGEMENTS_COLLECTION}&queryScope=collectionGroup&fields=userId,asc,createdAt,desc)
- Collection group '${param:ACKNOWLEDGEMENTS_COLLECTION}': `ackEvent` Ascending, `userId` Ascending, `createdAt` Descending
  - [Open Firebase Console](https://${param:LOCATION}-${param:PROJECT_ID}.cloudfunctions.net/ext-${param:EXT_INSTANCE_ID}-createIndex?collection=${param:ACKNOWLEDGEMENTS_COLLECTION}&queryScope=collectionGroup&fields=ackEvent,asc,userId,asc,createdAt,desc)

### Retrieving a notice

After the notice has been created, you’ll want to show this notice to your users once they are authenticated on your application. You can retrieve a notice by specifying the `type` to the `getNotice` function, for example:

```js
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const notice = await httpsCallable(functions, 'ext-${param:EXT_INSTANCE_ID}-getNotice')({
  type: 'banner',
});
```

The response of the function call will contain the notice document data, along with whether the current authenticated user has acknowledged the notice.

To retrieve a notice by a specific version, provide the `version` parameter:

```js
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const notice = await httpsCallable(functions, 'ext-${param:EXT_INSTANCE_ID}-getNotice')({
  type: ‘banner’,
  version: 2,
});
```

A user acknowledgment contains the following data:
- `userId`: The authenticated users UID.
- `noticeId` The notice ID of this acknowledgement.
- `createdAt`: A Timestamp indicating the time of acknowledgement.
- `ackEvent`: Whether this document is `acknowledged` or `unacknowledged`.
- `type`: If the `ackEvent` is `acknowledged`, the customizable type of acknowledgement. Defaults to `seen`.
- `metadata`: An optional object containing custom values relevant to the acknowledgement.

### Acknowledging a notice

To acknowledge a notice, the extension provides two callable functions which accept the notice ID: `acknowledgeNotice` & `unacknowledgeNotice`. The extension will keep historical records of each acknowledgement the callable functions are called multiple times for the same user and notice.

For example, to acknowledge a notice:

```js
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
await httpsCallable(functions, 'ext-${param:EXT_INSTANCE_ID}-acknowledgeNotice)({
  noticeId: 'EA9QhZKKta9KXcckiasc', // The notice ID from the `getNotice` call.
});
```

In-case you need to capture custom preferences relating to a acknowledgement, you can provide custom metadata to the function, for example:

```js
await httpsCallable(functions, 'ext-${param:EXT_INSTANCE_ID}-acknowledgeNotice)({
  noticeId: 'EA9QhZKKta9KXcckiasc',
  metadata: { readDuration: 30_000 },
});
```

You can also provide a custom “type” of acknowledgement (the default type is “seen”), for example:

```js
await httpsCallable(functions, 'ext-${param:EXT_INSTANCE_ID}-acknowledgeNotice)({
  noticeId: 'EA9QhZKKta9KXcckiasc',
  type: 'accepted',
});
```

If you wish to unacknowledge a notice, call the `unacknowledgeNotice` function:

```js
await httpsCallable(functions, 'ext-${param:EXT_INSTANCE_ID}-unacknowledgeNotice)({
   noticeId: 'EA9QhZKKta9KXcckiasc',
  metadata: { reason: '...' },
});
```

### Retrieving acknowledgements

To retrieve all previous user notice acknowledgements, call the `getAcknowledgements` callable function. This function will return an ordered array of all acknowledgements along with the notice data:

```js
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const acknowledgements = await httpsCallable(functions, 'ext-${param:EXT_INSTANCE_ID}-getAcknowledgements)();
```

```js
const acknowledgements = await httpsCallable(functions, 'ext-${param:EXT_INSTANCE_ID}-getAcknowledgements)({
  includeUnacknowledgements: true,
});
```

### User specific acknowledgements

In-case a notice is only specific to certain users, specify an `allowList` array of UIDs to the notice document. If the user requesting a notice by type is not within the list of UIDs and `not-found` error will be returned.

### Updating a notice

When it’s time to update a notice, for example when additional user preferences are required, create a new notice document with the same `type` of the existing notice you wish to update.

When the notice is retrieved, a new notice document will be returned with no user acknowledgement, allowing users to acknowledge the newer notice.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
