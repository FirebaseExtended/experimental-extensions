# Using the extension
When triggered by an HTTP request, this extension responds with a built data bundle stream.
You can parameterize the request to stream data bundles from local cache; if bundle data is
not available in local cache, queries will run against the Firestore back-end to get the
data and build the bundle. If you use Firebase Hosting or Cloud Storage for Firebase in your
projects, you can stream bundles from Hosting cache or a Cloud Storage file.

To learn more about HTTP functions, visit the [functions documentation](https://firebase.google.com/docs/functions/http-events).


## Creating data bundle specification documents

During extension configuration, you identified a Firestore collection for storing data bundle specifications, with each document
being the specification for one data bundle.

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
