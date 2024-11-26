# See it in action

You can test out this extension right away!

Collect the following information from the trace of a recent feature invocation. This can be found in HTTP response headers for a Genkit flow, or by browsing the Cloud Trace Explorer.
- Feature name (ie. the name of the Genkit Flow)
- Trace ID
- Span ID of the root span in the above trace

If you're using the "standard" (non-callable) Function, send a cURL request as follows:

```shell
curl -d '{"name": "$featureName", "traceId": "$traceId", "spanId": "$spanId", "feedback": {"value": "positive", "text": "Best feature ever!"}}' \
  -H 'Content-Type: application/json' \
  ${function:collectEngagement.url}
```

If you're using the callable Function, call `collectEngagement` from your client
with the above data schema. App Check must be enabled if selected.

# Using the extension

When triggered by an HTTP request, this extension attaches the provided feedback and/or acceptance data to the provided Trace, and responds with an empty object.

To learn more about HTTP functions, visit the [functions documentation](https://firebase.google.com/docs/functions/http-events).

# Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
