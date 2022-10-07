import path from "path";

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/export-user-data.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "export-user-data";
})();
