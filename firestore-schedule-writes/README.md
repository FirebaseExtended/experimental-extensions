# Schedule Firestore Writes

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Write documents to Firestore at an arbitrary time in the future.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/firestore-schedule-writes)

### Firebase CLI

```bash
firebase ext:install firebase/firestore-schedule-writes --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: Schedule Firestore Writes allows you to write data to a collection in Firestore that is then written to a different location at a specified time in the future. This can be used for many common time-related tasks such as delayed notifications, alarms, and reminders. Because this all happens within Firestore, scheduled writes can be listened to by clients or connected with via Cloud Functions.

Scheduling a write requires only writing a document to Firestore:

```js
const TEN_MINUTES_MS = 10 * 60 * 1000;

firebase
  .firestore()
  .collection("queued_writes")
  .add({
    state: "PENDING",
    data: { message: "Hello from the future!" },
    deliverTime: firebase.firestore.Timestamp.fromMillis(
      Date.now() + TEN_MINUTES_MS
    ),
  });
```

# Before Installation

This extension requires Firestore to be configured for your project, including a [default App Engine location](https://firebase.google.com/docs/projects/locations#set-firestore-storage-schfunctions) for scheduled functions.

# Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

<!-- List all products the extension interacts with -->

- Cloud Functions
- Cloud Firestore

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Message Queue Collection: The name of the Firestore collection in which queued messages will be stored.

- Target Collection: The collection into which queued writes should be delivered when processed. If specified, no writes will be performed outside of the target collection. If blank, each scheduled write can specify its own target collection.

- Merge Writes: When true, writes to existing documents are merged with existing data. When false, writes to existing documents overwrite existing data.

- Staleness Threshold (in minutes): The duration (in minutes) after which a scheduled message should be abandoned as stale. Considered indefinite if "0" or blank.

- Cleanup Policy: How to handle messages in the queue collection once successfully delivered.

- Processing Schedule: The schedule (in [cron syntax](https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules)) at which messages should be evaluated for delivery. Defaults to every minute.

**Cloud Functions:**

- **deliverWrites:** Function that runs periodically to find queued writes and deliver them to their intended destination.

**Access Required**:

This extension will operate with the following project IAM roles:

- datastore.user (Reason: Allows this extension to fetch and process messages in the queue.)

