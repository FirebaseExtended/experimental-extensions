const path = require("path");

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/storage-image-labelling.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "storage-image-labelling";

  process.env.GCLOUD_PROJECT = "demo-test";
  process.env.PROJECT_ID = "demo-test";
})();
