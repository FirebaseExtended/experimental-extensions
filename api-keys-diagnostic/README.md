# API Keys Diagnostic

**Author**: undefined

**Description**: The API Keys Diagnostic Extension is a security-focused tool designed to safeguard your Firebase project. It routinely scans your project's API keys and sends EventArc events if it detects any unrestricted keys.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/api-keys-diagnostic)

### Firebase CLI

```bash
firebase ext:install firebase/api-keys-diagnostic --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: The API Keys Diagnostic Extension helps you identify unsecured API keys in your Firebase project by regularly scanning your project's API keys and sending notifications if any unrestricted keys are found.

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

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Schedule: What cron schedule would you like the diagnostic to run on?

**Cloud Functions:**

- **apiKeysDiagnostic:** Runs a diagnostic on the API keys in your project every day.

**Access Required**:

This extension will operate with the following project IAM roles:

- cloudscheduler.admin (Reason: Allows the extension to create a new Cloud Scheduler function.)

