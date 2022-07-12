import path from "path";

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/firestore-tos-extension.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "firestore-tos-extension";
})();
