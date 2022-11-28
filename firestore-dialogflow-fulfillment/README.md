# Firestore DialogFlow Fulfillment

This extension integrates with DialogFlow through Firestore.

## Setup and development

You need a DialogFlow agent and Firebase project to use this extension.

### DialogFlow Calendar Intent

1. Create a new agent in DialogFlow.
2. Add a new intent to the agent named `intent.calendar`.
3. Train the agent on phrases like:
   1. I have a meeting `tomorrow` at `6 PM`.
   2. Set an appointment on `Wednesday` at `2 PM`.

   Annotate the date and time expressions.
4. Add 2 parameters: `DATE` and `TIME`. Give them the `@sys.date` and `@sys.time` entity types respectively. Make them required. Provide a prompt for each.

### Install The Extension

#### Pre-requisites

1. Make sure `firebase-tools` is installed: `npm i -g firebase-tools`.
2. You are using Node 14 (`nvm use 14`).

#### Install

To install the extension, run:

```bash
firebase ext:install . --project=extensions-testing
```

The extension will deploy a HTTP function that will be used as a Fullfilment webhook for DialogFlow. The function will look like this, with the `PROJECT_ID` replaced with your project ID, and the `LOCATION` replaced with your project's default Cloud Functions location:

```bash
https://{LOCATION}-{PROJECT_ID}.cloudfunctions.net/ext-firestore-dialogflow-fulfillment-dialogflowFulfillment
```

Provide the URL to DialogFlow as the Fulfillment webhook URL.

### Development

1. `cd firestore-dialogflow-fulfillment/functions` && `npm run build`
2. `cd firestore-dialogflow-fulfillment/demo` && `npm run dev`
3. `cd _emulator` && `firebase emulators:start`

## DialogFlow

https://dialogflow.cloud.google.com/#/agent/extensions-testing/editIntent/334a55e8-3280-4651-b1d8-109ceb78cfd4/

- Agent = Overall agent who will handle the conversation
- Intent = Based on user input, dialogflow will match to an intent based on the settings in that intent
 - We are trying to get a DATE & TIME from the user (to do something with, e.g. add something to Google calendar)
 - If DialogFlow doesn't have both parameters, it will ask the user for them (based on ML and the data in the intent config)

- Each time DialogFlow gets a message, it'll send it through the webhook (https://dialogflow.cloud.google.com/#/agent/extensions-testing/fulfillment)
 - In our webhook logic, if the intent matches one we care about AND we have both DATE & TIME parameters, we'll send a message to the user, otherwise just let DialogFlow handle it.
 - At this point we'll go and do some API task and respond to the user (e.g. "I've added that to our calendar, see you on X at Y")

(Note: Been using https://ngrok.com/ to pipe the webhook messages to the emulator - just needs installing and setting up on the port functions are running on).

The current general flow for the extension is:

- `newConversation` - Callable Function. Takes a message, creates a new conversation and adds a doc to a subcollection, and returns the ID (which the user can use to listen to new messages).
- `newMessage` - adds a new user message to the conversation 
- `onNewMessage` - a firestore trigger that listens for new messages. If it's from the user, we'll send a message to dialog flow and wait for a response. Once we have that, add a message to the conversation.
- `dialogflowFulfillment` - HTTP function (ignores auth for now), which DialogFlow calls - here we can respond with our own messages to the user if we want.

Use `lsof -t -i:4001 -i:8080 -i:9000 -i:9099 -i:9199 -i:8085 | xargs kill -9` to kill emulators.