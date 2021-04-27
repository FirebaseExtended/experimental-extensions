module.exports = async function () {
  process.env = Object.assign(process.env, {
    BUCKET: "test.appspot.com",
    LOCATION: "us-central1",
    FIRESTORE_ROOT: "gcs-mirror/test.appspot.com",
    ITEMS_SUBCOLLECTION_NAME: "items",
    ITEMS_TOMBSTONES_NAME: "items-tombstones",
    PREFIXES_SUBCOLLECTION_NAME: "prefixes",
    PREFIXES_TOMBSTONES_NAME: "prefixes-tombstones",
    CUSTOM_METADATA_FILTER: ".*",
    METADATA_FIELD_FILTER: ".*",
    OBJECT_NAME_FILTER: ".*",
  });
};
