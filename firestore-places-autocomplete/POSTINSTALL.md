This extension will now enhance your Firebase project by providing real-time address suggestions for your Firestore documents using Google Maps Places API's Autocomplete feature.

### See it in action
Add input field to Firestore documents: Ensure that each document in the specified Firestore collection contains an input field with the address or location text you want to get autocomplete suggestions for.

```js
admin
  .firestore()
  .collection("${param:COLLECTION_PATH}")
  .add({
    input: "Paris",
  });
```

Monitor address predictions: Once the extension is installed, it will automatically fetch address predictions from the [Google Maps Places API](https://developers.google.com/maps/documentation/javascript/get-api-key) whenever a new document is added or an existing document is updated in the specified Firestore collection. The predictions will be stored in the `ext_PlacesAutocomplete` field within the document.

The structure of the `ext_PlacesAutocomplete` field will be as follows:

```js
{
  "predictions": [
    {
      "description": "Paris, France",
      "place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
      ...
    },
    {
      "description": "Paris, TX, USA",
      "place_id":"ChIJmysnFgZYSoYRSfPTL2YJuck",
      ...
    },
    ...
  ]
}
```

You can use these predictions to enhance your application's user experience by offering real-time address suggestions as users type.

To see all output for the predictions, view the Autocomplete [documentation](https://developers.google.com/maps/documentation/places/web-service/autocomplete)

### Error handling: 
In case of errors during the autocomplete process, the extension will log the error message and update the document's `ext_PlacesAutocomplete`.error field with the error details. 

Make sure to handle these errors appropriately in your application.

# Monitoring
As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.