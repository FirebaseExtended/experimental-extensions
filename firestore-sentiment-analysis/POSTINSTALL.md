### See it in action

You can test out this extension right away!

1.  Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

1.  If you do not already have one, create a new collection.

1.  Create a document with a field named `${param:INPUT_FIELD_NAME}`, then add a phrase that you want to analyze.

1.  In a few seconds, you'll see a new field called `${param:OUTPUT_FIELD_NAME}` pop up in the same document you just created. It will contain the sentiment score and magnitude for your input phrase. 

### Using the extension

Whenever you write a string to the field `${param:INPUT_FIELD_NAME}` in `${param:COLLECTION_PATH}`, this extension does the following:

- Processes the sentiment of the text using Google Cloud's Natural Language Processing API. This generates the sentiment and the score for the text. More information on this API can be found [here](https://cloud.google.com/natural-language/docs/basics#:~:text=Sentiment%20analysis%20response%20fields,-A%20sample%20analyzeSentiment&text=score%20of%20the%20sentiment%20ranges,%2C%20between%200.0%20and%20%2Binf%20.).
- Adds the sentiment of the string to a separate specified field in the same document.

```
{
  ${param:INPUT_FIELD_NAME}: 'Firebase is absolutely amazing. 10/10, would recommend it to everyone I know.',
  ${param:OUTPUT_FIELD_NAME}: {
    magnitude: 1.899999976158142,
    score: 0.8999999761581421,
  },
}
```

If the `${param:INPUT_FIELD_NAME}` field of the document is updated, then the sentiment will be automatically updated, as well.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
