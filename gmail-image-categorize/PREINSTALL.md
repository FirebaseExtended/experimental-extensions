This extension will export a description of attached images from a Gmail account to a Google Sheet. 
The description is generated using Google Vision API.

# Requirements before installation

## Authorize access to Gmail

Before installing the extension to automatically read emails, you must authorize its access to Gmail. You will need to register an OAuth client with Google and create an associated client ID.

### Register an OAuth client

Go to the **OAuth 2.0 consent screen** in the [Google Cloud Platform Console](https://console.cloud.google.com/apis/credentials/consent?cloudshell=false&project=`${param:PROJECT_ID}`). Type in a name in the **Application name** field. Leave other settings untouched, scroll down the page and click **Save**.

### Create an associated client ID

Switch to the **Credentials** tab. Click Create Credentials and choose OAuth client ID. Pick the Web application type, give it a name (you may use the same Application name), and click **Create**.

Copy the client ID and the client secret returned in the pop-up window. You will use them in the installation process.

### Add authroized redirect URIs and domains

The extension will use the client ID to authorize access to Gmail. To do so, it will redirect the user to a Google sign-in page. After the user signs in, Google will redirect the user back to the extension. The extension will use the redirect URI to verify that the user is authorized to access Gmail.

Go to **Credentials** page in the [Google Cloud Platform Console](https://console.cloud.google.com/apis/credentials?cloudshell=false&project=`${param:PROJECT_ID}`).

Add the following domain to the list of **Authorized JavaScript origins**:
```
https://${process.env.LOCATION}-${process.env.PROJECT_ID}.cloudfunctions.net
```

Add the following redirect URI to the list of **Authorized redirect URIs**:
``` 
https://${process.env.LOCATION}-${process.env.PROJECT_ID}.cloudfunctions.net/callback
```

# Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
