### See it in action

You can test out this extension right away!

1.  Go to your [Storage dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/storage) in the Firebase console.

1.  Upload an image file to the bucket: `${param:IMG_BUCKET}`
    
    Note the file must be within the directories `${param:INCLUDE_PATH_LIST}` if set, and not in the directories `${param:EXCLUDE_PATH_LIST}` if it set. 

1.  In a few seconds, the extracted text will appear in the `${param:COLLECTION_PATH}` Firestore collection.

    Note that you might need to refresh the page to see changes.

### Using the extension

You can upload images using the [Cloud Storage for Firebase SDK](https://firebase.google.com/docs/storage/) for your platform (iOS, Android, or Web). Alternatively, you can upload images directly in the Firebase console's Storage dashboard.

Whenever you upload an image to the specified bucket and directory, this extension will extract text from any images uploaded to a specific Cloud Storage bucket, and write the extracted text to Firestore, under the name of the file that was uploaded.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.

### Further reading & resources