# Using the extension

This extension will annotate media that appears in the `${param:INPUT_VIDEOS_BUCKET}` storage bucket under the `${param:INPUT_VIDEOS_PATH}` folder.

Results of the transcoding will appear in the `${param:OUTPUT_BUCKET}` storage bucket inside the `${param:OUTPUT_VIDEOS_PATH}` folder.

Please see [supported_inputs_outputs](https://cloud.google.com/video-intelligence/docs/supported-formats) for valid media formats.

Please note: Depending on the file size, some media may take time to `annotate` and appear inside the `${param:OUTPUT_PATH}` folder.

<!-- We recommend keeping the following section to explain how to monitor extensions with Firebase -->

# Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
