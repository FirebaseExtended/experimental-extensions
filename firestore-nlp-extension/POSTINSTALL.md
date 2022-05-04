### See it in action

You can test out this extension right away!

1.  Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/database/firestore/data) in the Firebase console.

1.  If it doesn't exist already, create a collection called `${param:COLLECTION_PATH}`.

1.  Create a document with a field named `${param:INPUT_FIELD_NAME}`, then make its value a phrase that you want to perform NLP task(s) on.

1.  In a few seconds, you'll see a new field called `${param:OUTPUT_FIELD_NAME}` pop up in the same document you just created. It will contain the data for each of the NLP tasks you specified during installation. 

### Using the extension

Whenever you write a string to the field `${param:INPUT_FIELD_NAME}` in `${param:COLLECTION_PATH}`, this extension does the following:

- Performs the following NLP tasks: `${param:TASKS}`.
- Adds the results from the tasks to `${param:OUTPUT_FIELD_NAME}` in the same document using the following format:

```
{
  ${param:INPUT_FIELD_NAME}: 'I love Paris!',
  ${param:OUTPUT_FIELD_NAME}: {
    CLASSIFICATION: [
      '/Travel'
    ],
    ENTITY: {
      LOCATION: [
        'Paris'
      ]
    },
    SENTIMENT: {
      magnitude: 0.9,
      score: 0.9
    }
  },
}
```

- Note the example above is generic. The tasks showing up according to your configuration are `${param:TASKS}`. For entity extraction, the entity types saved will be `${param:ENTITY_TYPES}`.

If the `${param:INPUT_FIELD_NAME}` field of the document is updated, then the NLP data will be automatically updated, as well (by overwriting).

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
