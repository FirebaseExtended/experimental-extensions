### See it in action

You can test out this extension right away!

1. Go to your [Authentication dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/authentication/users) in the Firebase console.

1. Click **Add User** to add a test user, then copy the test user's UID to your clipboard.

2. Access the user through any of the authetication methods.

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
- terms

The extension will provide `4` new functions for managing ackowledgement for users.

**Accept Terms**

  ```js
    // < v9
    var acceptTerms = firebase.functions().httpsCallable('acceptTerms');
    await acceptTerms({ tosId });
  ```

  ```js
    // v9
    import { getFunctions, httpsCallable } from "firebase/functions";

    const functions = getFunctions();
    const acceptTerms = httpsCallable(functions, 'acceptTerms');
    await acceptTerms({ tosId });
  ```

**Create Terms**

  Creates a new terms of service, based on the following schema:

  ```js
    export interface TermsOfServiceMetadata {
        tosId: string;
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
    var createTerms = firebase.functions().httpsCallable('createTerms');
    await createTerms( { tosId, link, creationDate });
  ```

  ```js
    // v9
    import { getFunctions, httpsCallable } from "firebase/functions";

    const functions = getFunctions();
    const acceptTerms = httpsCallable(functions, 'acceptTerms');
    await acceptTerms( { tosId, link, creationDate });
  ```

**Get Terms**

  ```js
    // < v9
    var getTerms = firebase.functions().httpsCallable('createTerms');
    await getTerms( tosId);
  ```

  ```js
    // v9
    import { getFunctions, httpsCallable } from "firebase/functions";

    const functions = getFunctions();
    const getTerms = httpsCallable(functions, 'getTerms');
    await getTerms({ tosId });
  ```

**Get Acknowledgements**

  ```js
    // < v9
    var getTerms = firebase.functions().httpsCallable('createTerms');
    await getTerms({ tosId });
  ```

  ```js
    // v9
    import { getFunctions, httpsCallable } from "firebase/functions";

    const functions = getFunctions();
    const getAcknowledgements = httpsCallable(functions, 'getAcknowledgements');
    await getAcknowledgements();
  ```

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
