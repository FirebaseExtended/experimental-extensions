import path from "path";

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/firestore-record-user-acknowledgements.env.local"
    ),
  });

  process.env.EXT_INSTANCE_ID = "firestore-record-user-acknowledgements";
})();
