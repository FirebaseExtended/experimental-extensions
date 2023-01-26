Click on the following link to allow the extension to set up Gmail push notifications:

https://${param:LOCATION}-${param:PROJECT_ID}.cloudfunctions.net/${param:EXT_INSTANCE_ID}/initializeAuth

You will be prompted to accept the permissions request. Once you have accepted, you will be redirected to a page that says "Success! You can close this page now."

You will notice a new Google Sheet created in your Google Drive. This is where the extension will store the image URLs and labels one a new email with an image attachment arrives at your inbox.
