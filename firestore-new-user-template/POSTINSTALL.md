### See it in action

You can test out this extension right away!

1. Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

2. If it doesn't exist already, create a document with path `${param:TEMPLATE_DOC_PATH}`.

3. In the `${param:TEMPLATE_DOC_PATH}`, create multiple fields, one of them need to be `${param:USER_NAME_FIELD_NAME}`.

4. In the [Firebase Authentication console](https://console.firebase.google.com/project/${param:PROJECT_ID}/authentication/users), create a new user.

5. In a few seconds, under `${param:USER_COLLECTION_PATH}`, there will be a new user document with the `${param:USER_NAME_FIELD_NAME}` filled with the new user's display name.

6. Delete any user in [Firebase Authentication console](https://console.firebase.google.com/project/${param:PROJECT_ID}/authentication/users), the user document with that userID will disappear from `${param:USER_COLLECTION_PATH}`.


### Using the extension



### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
