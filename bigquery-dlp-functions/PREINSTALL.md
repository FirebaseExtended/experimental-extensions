Use this extension to de-identify sensitive data in BigQuery using the [Data Loss Prevention API](https://cloud.google.com/dlp/docs/).

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
