const path = require("path");

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/firestore-text-to-speech.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "firestore-text-to-speech";
  process.env.GOOGLE_CLOUD_PROJECT = "demo-test";
  process.env.GCLOUD_PROJECT = "demo-test";
  process.env.PROJECT_ID = "demo-test";
})();
