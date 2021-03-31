# storage-label-videos

**Description**: Extracts labels from your videos uploaded to Storage and writes the extracted labels to Storage as a JSON file.

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?sourceName=NOT_YET_DEPLOYED)

### Firebase CLI

```bash
firebase ext:install storage-label-videos --project=<your-project-id>
```

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

**Details**: ### TODO

**Configuration Parameters:**

- Cloud Functions location: Cloud region where annotation should take place. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Input storage uri: A Storage location the extension should process videos from.

- Output storage uri: Optional. Location where the output (in JSON format) should be stored.

- Label detection mode: What labels should be detected with LABEL_DETECTION, in addition to video-level labels or segment-level labels. If unspecified, defaults to SHOT_MODE.

- Video confidence threshold: The confidence threshold we perform filtering on the labels from video-level and shot-level detections. If not set, it is set to 0.3 by default. The valid range for this threshold is [0.1, 0.9]. Any value set outside of this range will be clipped. Note: for best results please follow the default threshold. We will update the default threshold everytime when we release a new model.

- Frame confidence threshold: The confidence threshold we perform filtering on the labels from frame-level detection. If not set, it is set to 0.4 by default. The valid range for this threshold is [0.1, 0.9]. Any value set outside of this range will be clipped. Note: for best results please follow the default threshold. We will update the default threshold everytime when we release a new model.

- Model: Model to use for label detection.

- Stationary Camera: Whether the video has been shot from a stationary (i.e. non-moving) camera. When set to true this might improve detection accuracy for moving objects. Will default to false if LABEL_DETECTION_MODE has been set to SHOT_AND_FRAME_MODE.

**Cloud Functions:**

- **analyse:** Listens to incoming Storage documents that are videos and executes video labelling detection on them.

**APIs Used**:

- videointelligence.googleapis.com (Reason: Powers all Video Intelligence tasks performed by the extension.)

**Access Required**:

This extension will operate with the following project IAM roles:

- storage.admin (Reason: Allows the extension to write to your Cloud Storage.)

