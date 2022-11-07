### See it in action

You can test out this extension right away!

1. Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

1. If it doesn't exist already, create a collection called `${param:USER_COLLECTION_NAME}`.

1. In the `${param:USER_COLLECTION_NAME}`, create a few documents with fields named `${param:SCORE_FIELD_NAME}`, `${param:LEADER_BOARD_FIELDS}`

1. In a few seconds, under `${param:LEADERBOARD_COLLECTION_NAME}`, there will be a new leaderboard document.

1. Make a change to the `${param:SCORE_FIELD_NAME}` field on any user document. In a few seconds, the leaderboard document will update with the new value.


### Using the extension

This extension TODO `${param:SCORE_FIELD_NAME}` field of the document is updated




### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
