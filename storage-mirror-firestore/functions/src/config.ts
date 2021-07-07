const config = {
  bucket: process.env.BUCKET,
  location: process.env.LOCATION,
  firestoreRoot: process.env.FIRESTORE_ROOT,
  itemsSubcollectionName: process.env.ITEMS_SUBCOLLECTION_NAME || "items",
  itemsTombstoneSubcollectionName:
    process.env.ITEMS_TOMBSTONES_NAME || "items-tombstones",
  prefixesSubcollectionName:
    process.env.PREFIXES_SUBCOLLECTION_NAME || "prefixes",
  prefixesTombstoneSubcollectionName:
    process.env.PREFIXES_TOMBSTONES_NAME || "prefixes-tombstones",
  customMetadataFieldFilter: new RegExp(
    process.env.CUSTOM_METADATA_FILTER || ".*"
  ),
  metadataFieldFilter: new RegExp(process.env.METADATA_FIELD_FILTER || ".*"),
  objectNameFilter: new RegExp(process.env.OBJECT_NAME_FILTER || ".*"),
};

export default config;
