### See it in action

You can test out this extension right away!

1. Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

1. If it doesn't exist already, create a collection called `${param:SCORE_COLLECTION_PATH}`.

1. In the `${param:SCORE_COLLECTION_PATH}`, create a few documents with fields named `${param:SCORE_FIELD_NAME}`, `${param:USER_NAME_FIELD_NAME}`

1. In a few seconds, under `${param:LEADERBOARD_COLLECTION_PATH}`, there will be a new leaderboard document `${param:LEADER_BOARD_NAME}`.

1. Make a change to the `${param:SCORE_FIELD_NAME}` field on any user document. In a few seconds, the leaderboard document will update with the new value.

### Using the extension

This extension creates and maintains a leaderboard document in Firestore database. The document will collect and monitor the user score updates in user documents under collection `${param:SCORE_COLLECTION_PATH}`.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
