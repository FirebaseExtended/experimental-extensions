# BigQuery DLP Remote Function

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: TODO

**Configuration Parameters:**

- DLP Transformation Method: The method used by Data Loss Prevention API to deidentify and/or encrypt sensitive information in the data.

- BigQuery Dataset ID: The ID of the dataset where the extension will create a connection.

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

**Cloud Functions:**

- **createBigQueryConnection:** Creates a BigQuery connection.

- **deidentifyData:** TODO

**APIs Used**:

- bigquery.googleapis.com (Reason: Powers all BigQuery tasks performed by the extension.)

- bigqueryconnection.googleapis.com (Reason: Allows the extension to create a BigQuery connection.)

- dlp.googleapis.com (Reason: Allows the extension to use DLP services.)

**Access Required**:

This extension will operate with the following project IAM roles:

- bigquery.jobUser (Reason: Allows the extension to create BigQuery jobs.)

- bigquery.dataOwner (Reason: Allows the extension to create BigQuery routines.)

- bigquery.connectionAdmin (Reason: Allows the extension to create a BigQuery connection.)

- dlp.user (Reason: Allows the extension to use DLP services.)

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/bigquery-dlp-function)

### Firebase CLI

```bash
firebase ext:install firebase/bigquery-dlp-function --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

