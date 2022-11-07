# Firestore Leaderboard

<!-- Insert preinstall-->



**Configuration Parameters**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your Storage bucket. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Score Field Name:  The fieldname representing the score used for leaderboard calculations. Defaults to score.


* Score Collection Path: What is the Firestore path that contains the user scores? For example, if you have the collections player_scores, and each collection has documents containing fields/values representing user ID and score, then you can enter playerScores/{docID}. Defaults to user_scores.


* User Name Field Name: The fieldname representing the user name for leaderboard display. Defaults to user_name. 

* Leaderboard Collection Path: What is the collection we should use to create the leaderboard document? Defaults to leaderboard. 

* Leaderboard Name: The name of the leaderboard document.


* Leaderboard Size: How many entries to keep in the leaderboard?


**Cloud Functions:**

* **onScoreUpdate:** Listens for changes on score update in any user document and updates the leaderboard.

**Access Required**:

This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows the extension to read from and write data to Cloud Firestore.)