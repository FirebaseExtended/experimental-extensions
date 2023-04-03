This extension will label (classify) any images uploaded to a specific Cloud Storag bucket and write the labels to Firestore.

# Detailed configuration information

This extension provides the following paramters for you to configure its behaviour:

### Cloud Storage Bucket
Set this configuration parameter to specify which Cloud Storage bucket will you upload images on which you want to perform labeling.
### Include Path List

Setting this parameter will restrict storage-image-labeling to only label images in specific locations in your Storage bucket by supplying a comma-separated list of absolute paths.

For example, specifying the paths `/users/pictures,/restaurants/menuItems` will label any images found in any subdirectories of `/users/pictures` and `/restaurants/menuItems`. You may also use wildcard notation for directories in the path.

### Exclude Path List

This parameter is a list of absolute paths not included for labelled images.

Setting is will ensure storage-image-labeling does not label images in the specific locations.

For example, to exclude the images stored in the `/foo/alpha` and its subdirectories and `/bar/beta` and its subdirectories, specify the paths `/foo/alpha,/bar/beta`. You may also use wildcard notation for directories in the path.

### Collection Path

Set this parameter to specify which collection in Firestore the extension should write labels to.

### Label Mode

This parameter sets how much label information should be written to Firestore. If set to "basic" the extension will simply write the list of labels as a string array. If set to "full" then the full information returned from Cloud Vision will be written to the Firestore document.

# Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

<!-- List all products the extension interacts with -->

- Cloud Functions
- Cloud Vision API
- Cloud Storage
- Cloud Firestore

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier (Blaze) billing plan is required because the extension uses Cloud Vision API.
