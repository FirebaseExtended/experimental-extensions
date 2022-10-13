# See it in action

You can test out this extension right away!

1. Go to your [Authentication dashboard](https://console.firebase.google.com/project/$%7Bparam:PROJECT_ID%7D/authentication/users) in the Firebase console.
2. Click Add User to add a test user, then copy the test user's UID to your clipboard.
3. Create a new Cloud Firestore document, a new Realtime Database entry, or upload a new file to Storage - incorporating the user's UID into the path according to the schema that you configured.
4. Clone and run the [demo web app](TODO) by following the instructions in the [README](TODO). Click the export button to kick off an export.
5. In a few seconds, the new data you added above will be exported from Cloud Firestore, Realtime Database, and/or Storage (depending on what you configured). You will see the resulting export files in Cloud Storage under the storage path you specified in configuration parameters.
