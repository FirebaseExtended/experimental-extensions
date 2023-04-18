const path = require("path");

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/firestore-schedule-writes.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "firestore-schedule-writes";

  process.env.GCLOUD_PROJECT = "demo-test";
  process.env.PROJECT_ID = "demo-test";
})();
