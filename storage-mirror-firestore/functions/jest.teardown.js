module.exports = async function() {
  delete process.env.BUCKET;
  delete process.env.LOCATION;
  delete process.env.FIRESTORE_ROOT;
  delete process.env.ITEMS_SUBCOLLECTION_NAME;
  delete process.env.PREFIXES_SUBCOLLECTION_NAME;
  delete process.env.CUSTOM_METADATA_FILTER;
  delete process.env.METADATA_FIELD_FILTER;
};
