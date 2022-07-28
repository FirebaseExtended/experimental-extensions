### See it in action

You can test out this extension right away!

1. Go to your [Authentication dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/authentication/users) in the Firebase console.

1. Click **Add User** to add a test user, then copy the test user's UID to your clipboard.

2. Access the user through any of the authetication methods.

```js
    const user = await getAuth().getUser(uid);
```

3. Provide the user / userId into one of the available functions.

### Using the extension

All consent documents are managed in the Cloud Firestore database.

These can be found in ${param:COLLECTION_PATH}.

This will also contain two pre-defined subcollections:

- acceptances
- terms

The extension will provide `4` new functions for managing consent for users.

**Accept Terms**

  ```js
    await acceptTermsFn.call({},
      { tosId }, { auth: { uid: user.uid } }
    );
  ```

**Create Terms**

  Creates a new terms of service, based on the following schema:

  ```js
    export interface TermsOfServiceMetadata {
        tosId: string;
        link: string;
        creationDate: string;
        allowList?: string[];
        customAttributes?: {
            [key: string]: any;
        };
    }
  ```

  This can be called via:

  ```js
    await createTermsFn.call({},
        { tosId, link, creationDate },
        { auth: { uid: "test" } }
    );
  ```

**Get Terms**

```js
    const terms = await getTermsFn.call({},
        { tosId },
        { auth: { uid: user.uid } }
    );
```

**Get Acceptances**

```js
    const acceptances = await getAcceptances.call({},
        {},
        { auth: { uid: user.uid } }
    );
```

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.