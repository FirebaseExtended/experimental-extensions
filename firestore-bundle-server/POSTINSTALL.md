# Using the extension
When triggered by an HTTP request, this extension responds with a built data bundle stream.
You can parameterize the request to stream data bundles from local cache; if bundle data is
not available in local cache, queries will run against the Firestore back-end to get the
data and build the bundle.

If you use Firebase Hosting or Cloud Storage for Firebase in your projects, you can stream
bundles from Hosting cache or a Cloud Storage bucket to your client-side apps. Firebase client
SDKs provide a [data bundles API](https://firebase.google.com/docs/firestore/bundles)
your apps can use to unpack documents and queries from the bundle.

To learn more about HTTP functions, visit the [functions documentation](https://firebase.google.com/docs/functions/http-events).


## Creating data bundle specification documents

During extension configuration, you identified a Firestore collection for storing data bundle specifications.
The default collection name is `bundles`.  Each document in the collection is the specification for building one data bundle.

You trigger building of a data bundle by calling the extension’s HTTP function and appending the document ID of the specification
to the URL path. For example, if you store a bundle specification in document `bundles/sportsScoresBundle`, sending `GET` to
`https://<region>-<project-name>.cloudfunctions.net/ext-firestore-bundle-server-serve/sportsScoresBundle` triggers assembly of
the bundle.

A data bundle specification document may contain these fields:

- **docs** an array of strings. Each string is the full path to a document to add to the bundle.
- **queries** a map of maps. Defines named queries to package into the bundle. The key of each inner map (in the following example, “scores”) corresponds to the name of one named query.
    
    - Queries Example
    <div style="margin-left: 50px;">
    &#9660;&nbsp;queries
    <br/>
    &nbsp;&nbsp;&nbsp;&#9660;&nbsp;scores
    <br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;collection: "scores"
    <br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#9660;&nbsp;conditions
    <br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#9660;&nbsp;0
    <br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#9660;&nbsp;where
    <br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0&nbsp;"sport"
    <br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1&nbsp;"=="
    <br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2&nbsp;"$sport"
    </div>

    - The inner map has the following fields:

      - A **collection** (string) field, identifying a collection to query. 
      - A **conditions** (array) field, containing one or more maps. Supplying more than one map configures a compound query.
      - A **where** (array) field, with one string value per query token.

- **params** a map of maps. Defines allowed URL query parameters the client can pass to parameterize how data bundles are built. Each inner map is the definition of one parameter, here the “sport” parameter, with a `required` (boolean) field and `type` (string) field.
  
  - Params Example
  <div style="margin-left: 50px;">
  &#9660;&nbsp;params
  <br/>
  &nbsp;&nbsp;&nbsp;&#9660;&nbsp;sport
  <br/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;required: "true"
  <br/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: "string"
  </div>

- **clientCache** a string value. Specifies how long to keep the bundle in the client's cache, in seconds. If not defined, client-side cache is disabled.
- **serverCache** a string value. Only use in combination with Firebase Hosting. Specifies how long to keep the bundle in Firebase Hosting's CDN cache, in seconds.  If not defined, Hosting CDN cache is accessed.
- **fileCache** a string value. Specifies how long to keep the bundle in a Cloud Storage bucket, in seconds. If not defined, Cloud Storage bucket is not accessed.
- **notBefore** a Timestamp value. When `fileCache` is specified, ignore bundles created before this timestamp.

## Using Firebase Hosting with this extension

If you use Firebase Hosting for your projects, you can use it to serve Firestore data bundles.
It might be beneficial to set up a Firebase Hosting [rewrite rule](https://firebase.google.com/docs/hosting/full-config#rewrites)
to utilize the global CDN network provided by Firebase to cache bundle files.

Example `firebase.json`:

```json
{
  "hosting": [
    {
      "site": "your-hosting-site",
      "public": "public",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        {
          "source": "/bundles/*",
          "function": "ext-firestore-bundle-server-serve"
        }
      ]
    }
  ]
}
```

After `firebase deploy`, you could access the bundle Function via `https://your-hosting-site/bundles/`.

# Monitoring
As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
