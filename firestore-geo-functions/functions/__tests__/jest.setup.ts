import path from "path";

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/firestore-geo-functions.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "firestore-geo-functions";
})();
