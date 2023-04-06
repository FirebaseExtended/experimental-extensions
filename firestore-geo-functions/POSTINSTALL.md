### See it in action

You can test out this extension right away!

1.  Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

1.  If it doesn't exist already, create a collection called `${param:COLLECTION_PATH}`.


### Using the extension

This extension adds extra information based on the frields provided.


#### Lat/long generation

Add a new document with an `address` field and add the full addresss of the location.

The extension will automatically add the `longitude and longitude` of the address.

```js
{
  address:  '1600 Amphitheatre Parkway, Mountain View, CA',
  latitude: 37.4223878
  longitude: -122.0841877
  ext_getLatLongStatus: {
    status: "ok"
  }
}
```

#### Calculate Driving Distance

Add a new document with `origin` and `destination`adding the full addresss of a location for each.

The extension will automatically add the `longitude and longitude` of the address.

```js
{
  origin:  '1600 Amphitheatre Parkway, Mountain View, CA',
  destination: '85 10th Ave, New York, NY' 
  bestDrivingTime: 157196
  ext_getLatLongStatus: {
    status: "ok"
  }
}
```

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.