## Setting up DialogFlow Fulfillment

First, copy this URL, which is the URL of the DialogFlow webhook: `https://${param:LOCATION}-${param:PROJECT_ID}.cloudfunctions.net/ext-${param:EXT_INSTANCE_ID}-dialogflowFulfillment`

Next, go to the DialogFlow console [here](https://dialogflow.cloud.google.com/#/agent/${param:PROJECT_ID}/fulfillment), enable the Webhook and add this URL as the Fulfillment webhook URL.

## Give the extension access to your calendar

To allow the extension to create events, you need to give it access to the calendar `${param:CALENDAR_ID}`. To do this, copy the extension service account principal email address from the [Service Accounts page](https://console.cloud.google.com/iam-admin/serviceaccounts) in the Google Cloud Console, which starts with `ext-${param:EXT_INSTANCE_ID}`. Then, go to your calendar Sharing settings, and add the email with **Make changes to events** permission.

## Using the extension

Call `newConversation` with a `message` to start a new conversation, which will return a `conversationId` that you can use to send messages to the same conversation.

```ts
export async function newConversation(message: string): Promise<string> {
  const result = await httpsCallable<{ message: string }, string>(
    functions,
    "ext-${param:EXT_INSTANCE_ID}-newConversation"
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
    "ext-${param:EXT_INSTANCE_ID}-newMessage"
  )({ conversationId, message });
}
```
