const path = require("path");

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/firestore-places-autocomplete.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "firestore-geo-functions";
  process.env.GCLOUD_PROJECT = "demo-test";
  process.env.PROJECT_ID = "demo-test";
  process.env.EVENTARC_CHANNEL = "my-eventarc-channel";
})();
