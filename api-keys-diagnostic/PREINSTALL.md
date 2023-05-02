The API Keys Diagnostic Extension helps you identify unsecured API keys in your Firebase project by regularly scanning your project's API keys and sending notifications if any unrestricted keys are found. 

This extension uses Cloud Functions to interact with the Google Cloud API and [Eventarc](https://cloud.google.com/eventarc/docs) to allow developers to subscribe to the discovery of any unrestricted keys.

### Scheduled scanning

This extension regularly scans your project's API keys: Cloud Function are scheudled to run based on the provided [cron](https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules) schedule, checking your project's API keys for any missing restrictions.

The Cloud Function filters the API keys to find any unrestricted keys and logs them.

If any unsecured API keys are found, the extension sends an event via the Eventarc channel.### 

### Pre-requisites

You need to set up a Eventarc function listener to subscribe to any unrestricted keys, and to handle the events accordingly. 

### Billing

To install an extension, your project must be on the Blaze (pay as you go) plan

You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).

This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
Google Cloud API
Eventarc
Cloud Functions (Node.js 10+ runtime. See FAQs)