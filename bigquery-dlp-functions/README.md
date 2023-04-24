# BigQuery DLP Remote Function

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: This extension creates BigQuery functions to facilitate de-identification and re-identification in queries, providing configurable techniques, seamless integration, and ensuring better data privacy and compliance.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/bigquery-dlp-functions)

### Firebase CLI

```bash
firebase ext:install firebase/bigquery-dlp-functions --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: Use this extension to de-identify sensitive data in BigQuery using the [Data Loss Prevention API](https://cloud.google.com/dlp/docs/).

This extension deploys 2 BigQuery remote functions, this extension:

- Perform de-identifaction on sensitive data passed as JSON from BigQuery.
- Re-identify sensitive data that were de-identified with reversable techniques.

You specify the desired DLP technique. All techniques are powered by the Google [Data Loss Prevention API](https://cloud.google.com/dlp/docs/transformations-reference). The options offered are:

- Replace with Masking.
- Redact a value (remove it from the data).

#### Additional setup

Before installing this extension, make sure that you've set up a BigQuery [dataset](https://cloud.google.com/bigquery/docs/datasets) and [table](https://cloud.google.com/bigquery/docs/tables).

#### Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

- Cloud Data Loss Prevention API
- BigQuery
- Cloud Functions

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

**Configuration Parameters:**

- DLP Transformation Method: The method used by Data Loss Prevention API to deidentify and/or encrypt sensitive information in the data.

- DLP Transformation Technique: The technique used by Data Loss Prevention API to deidentify and/or encrypt sensitive information in the data.

- List of fields to transform using record transformation (comma separated): The list of fields to transform using record transformation. This is only used when the transformation method is set to `RECORD`.

- BigQuery Dataset ID: The ID of the dataset where the extension will create a connection.

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

**Cloud Functions:**

- **createBigQueryConnection:** Creates a BigQuery connection.

- **deidentifyData:** TODO

- **reidentifyData:** TODO

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

