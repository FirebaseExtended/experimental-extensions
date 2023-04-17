const fetch = require("node-fetch");

export const clearFirestore = async (): Promise<void> => {
  await fetch(
    "http://localhost:8080/emulator/v1/projects/demo-test/databases/(default)/documents",
    { method: "DELETE" }
  );
};
