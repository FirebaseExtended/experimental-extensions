import path from "path";

(async function () {
  require("dotenv").config({
    path: path.resolve(
      __dirname,
      "../../../_emulator/extensions/firestore-crm-integration.env.local"
    ),
  });
})();
