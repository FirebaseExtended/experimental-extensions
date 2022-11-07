# Firestore New User Template

<!-- Insert preinstall-->

#### Additional setup

Make sure that you've set up [Firebase Authentication](https://firebase.google.com/docs/auth) to manage your users.

**Configuration Parameters**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your Storage bucket. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Template Doc Path:  The path for the template doc to use to create users, eg templates/user_template.


* User Collection Path: The collection path to put the newly created user document in. Default to users.


* User Name Field Name: The fieldname representing the user name, which will filled in with displayName from auth user attribute. Defaults to user_name. 


**Cloud Functions:**

* **onUserAdd:** Listens for changes on user added to Firebase Authentication.

* **onUserDelete:** Listens for changes on user deleted from Firebase Authentication.

* **onTemplateChange:** Listens for changes on template document is updated.

**Access Required**:

This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows the extension to read from and write data to Cloud Firestore.)