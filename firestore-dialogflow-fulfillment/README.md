# Firestore DialogFlow Fulfillment

This extension integrates with DialogFlow through Firestore, it can book meetings on your calendar from a DialogFlow conversation.

You don't need to interact with DialogFlow in your app as the extension do it for you and provide the conversation replies from DialogFlow in a Firestore collection.

## Install The Extension

Make sure `firebase-tools` is installed: `npm i -g firebase-tools`.

To install the extension, run:

```bash
firebase ext:install path/to/extension --project=extensions-testing
```

### DialogFlow agent setup

Before you can use the extension, you need to have a DialogFlow agent. The extension provides you with a HTTP function that you can call to create an agent for you, so you don't to do it manually.

To create and agent, you can call the `ext-firestore-dialogflow-fulfillment-createDialogflowAgent` function through the [Google Cloud CLI](https://cloud.google.com/sdk/gcloud):

```bash
gcloud config set project PROJECT_ID
gcloud config set functions/region LOCATION
gcloud functions call ext-firestore-dialogflow-fulfillment-createDialogflowAgent --data '{"data":""}'
```

This will create a new DialogFlow agent for you. You can find the agent in the DialogFlow console [here](https://dialogflow.cloud.google.com/#/agents).

### Setting up DialogFlow Fulfillment

The extension will deploy a HTTP function that will be used as a Fullfilment webhook for DialogFlow. The function will look like this, with the `PROJECT_ID` replaced with your project ID, and the `LOCATION` replaced with your project's default Cloud Functions location:

```bash
https://{LOCATION}-{PROJECT_ID}.cloudfunctions.net/ext-firestore-dialogflow-fulfillment-dialogflowFulfillment
```

Provide the URL to DialogFlow as the Fulfillment webhook URL.

### Give the extension access to your calendar

To allow the extension to create events, you need to give it access to the calendar `${param:CALENDAR_ID}`. To do this, copy the extension service account principal email address from the [Service Accounts page](https://console.cloud.google.com/iam-admin/serviceaccounts) in the Google Cloud Console, which starts with `ext-firestore-dialogflow`. Then, go to your calendar Sharing settings, and add the email with **Make changes to events** permission.

## Using the extension

Call `newConversation` with a `message` to start a new conversation, which will return a `conversationId` that you can use to send messages to the same conversation.

```ts
export async function newConversation(message: string): Promise<string> {
  const result = await httpsCallable<{ message: string }, string>(
    functions,
    "ext-firestore-dialogflow-fulfillment-newConversation"
  )({ message });
  return result.data;
}
```

To add new messages to the conversation, call `newMessage` with the `conversationId` and `message`.

```ts
export async function newMessage(
  conversationId: string,
  message: string
): Promise<void> {
  await httpsCallable<{ conversationId: string; message: string }, void>(
    functions,
    "ext-firestore-dialogflow-fulfillment-newMessage"
  )({ conversationId, message });
}
```

## Development

1. `cd firestore-dialogflow-fulfillment/functions` && `npm run build`
2. `cd firestore-dialogflow-fulfillment/demo` && `npm run dev`
3. `cd _emulator` && `firebase emulators:start`

(Note: Been using https://ngrok.com/ to pipe the webhook messages to the emulator - just needs installing and setting up on the port functions are running on).

Use `lsof -t -i:4001 -i:8080 -i:9000 -i:9099 -i:9199 -i:8085 | xargs kill -9` to kill emulators.