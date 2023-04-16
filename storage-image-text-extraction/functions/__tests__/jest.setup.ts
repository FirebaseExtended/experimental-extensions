const path = require("path");

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/storage-image-text-extraction.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "storage-image-text-extraction";

  process.env.GCLOUD_PROJECT = "demo-test";
  process.env.PROJECT_ID = "demo-test";
})();
