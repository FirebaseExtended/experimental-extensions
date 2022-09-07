### See it in action

You can test out this extension right away!

1. Go to your [Authentication dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/authentication/users) in the Firebase console.

1. Click **Add User** to add a test user, then copy the test user's UID to your clipboard.

2. Access the user through any of the authentication methods.

```js
   // v9
   import { getAuth, onAuthStateChanged } from "firebase/auth";

   const auth = getAuth();
   const user = await auth.getUser(uid);
```

```js
   // < v9
   import firebase from "firebase-admin";

   const user = await firebase.auth().getUser(uid);
```

3. Provide the user / userId into one of the available functions.

### Using the extension

All ackowledgement documents are managed in the Cloud Firestore database.

These can be found in the `${param:COLLECTION_PATH}` collection.

This will also contain two pre-defined subcollections:

- acknowledgements
- notices

The extension will provide `4` new functions for managing ackowledgement for users.

**Create Notices**

  Creates a new notice, based on the following schema:

  ```js
    export interface NoticeMetadata {
        noticeId: string;
        link: string;
        creationDate: string;
        allowList?: string[];
        noticeType?: {
            [key: string]: any;
        };
    }
  ```

  This can be called via:

  ```js
    // < v9
    var createNotice = firebase.functions().httpsCallable('createNotice');
    await createNotice( { noticeId, link, creationDate });
  ```

  ```js
    // v9
    import { getFunctions, httpsCallable } from "firebase/functions";

    const functions = getFunctions();
    const createNotice = httpsCallable(functions, 'createNotice');
    await createNotice( { noticeId, link, creationDate });
  ```

  **Using Preferences**

  Preferences can also be included as part of a notice type.

  ```js
  export interface Preference {
    name: string;
    description: string;
    duration?: string;
    value?: string;
    options?: string[];
    required: boolean;
    active?: boolean;
}
  ```

  There are two types of preference

- Singular, this contains a singular value.
- Multi-select, by defining a list for multiple options.

**Accept Notice**

  ```js
    // < v9
    var acknowledgeNotice = firebase.functions().httpsCallable('acknowledgeNotice');
    await acknowledgeNotice({ noticeId });
  ```

  ```js
    // v9
    import { getFunctions, httpsCallable } from "firebase/functions";

    const functions = getFunctions();
    const acknowledgeNotice = httpsCallable(functions, 'acknowledgeNotice');
    await acknowledgeNotice({ noticeId });
  ```

**Accepting preferences**

  By including the a `Notice Type` with a list of preferences. These will be stored as part of the accepted document.

  Use the preferences provided from an already created notices document as a guide on what to provide.

**Get Notice**

  ```js
    // < v9
    var getNotices = firebase.functions().httpsCallable('createNotice');
    await getNotices( noticeId);
  ```

  ```js
    // v9
    import { getFunctions, httpsCallable } from "firebase/functions";

    const functions = getFunctions();
    const getNotices = httpsCallable(functions, 'getNotices');
    await getNotices({ noticeId });
  ```

**Get Acknowledgements**

  ```js
    // < v9
    var getNotices = firebase.functions().httpsCallable('createNotice');
    await getNotices({ noticeId });
  ```

  ```js
    // v9
    import { getFunctions, httpsCallable } from "firebase/functions";

    const functions = getFunctions();
    const getAcknowledgements = httpsCallable(functions, 'getAcknowledgements');
    await getAcknowledgements();
  ```

#### Versioning

  If you need versioning for your notices, we support that out of the box. You can simply create multiple notices with the same notice_type, and the extension will give you a way to query the latest version of the a given notice_type.

### Custom notices

  If you have custom notices that are shown to specific users (for example, enterprise clients with custom requirements), you can specify a new notice_type and set an allow-list that only certain emails/phone numbers can view and accept.



### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
