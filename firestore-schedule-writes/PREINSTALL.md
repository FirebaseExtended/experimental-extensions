Schedule Firestore Writes allows you to write data to a collection in Firestore that is then written to a different location at a specified time in the future. This can be used for many common time-related tasks such as delayed notifications, alarms, and reminders. Because this all happens within Firestore, scheduled writes can be listened to by clients or connected with via Cloud Functions.

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

# Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

<!-- List all products the extension interacts with -->

- Cloud Functions
- Cloud Firestore

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)
