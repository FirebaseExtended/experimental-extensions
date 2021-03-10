# Using the extension

Upload images to the configured Storage bucket, `${param:IMG_BUCKET}`. A new document with extracted labels will appear in the `${param:COLLECTION_PATH}` Firestore collection within a few seconds. The document will have the name of the file which was uploaded.

# Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.