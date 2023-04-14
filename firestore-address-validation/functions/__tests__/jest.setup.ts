const path = require("path");

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/firestore-address-validation.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "firestore-address-validation";
  process.env.GCLOUD_PROJECT = "demo-test";
  process.env.GOOGLE_CLOUD_PROJECT = "demo-test";
  process.env.PROJECT_ID = "demo-test";
  process.env.EVENTARC_CHANNEL = "my-eventarc-channel";
})();
