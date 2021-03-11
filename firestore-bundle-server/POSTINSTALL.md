# See it in action
You can test out this extension right away!

TODO: fill in more details.

# Using the extension
When triggered by an HTTP request, this extension responds with a built bundle stream.

To learn more about HTTP functions, visit the [functions documentation](https://firebase.google.com/docs/functions/http-events).

It might be beneficial to setup a Firebase Hosting rewrite rule to utilize global CDN network provided by Firebase to cache bundle files.

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

<!-- We recommend keeping the following section to explain how to monitor extensions with Firebase -->
# Monitoring
As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
