module.exports = {
  rootDir: "./",
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsConfig: "<rootDir>/__tests__/tsconfig.json",
    },
  },
  setupFiles: ["<rootDir>/__tests__/jest.setup.ts"],
  testMatch: ["**/__tests__/*.test.ts"],
  moduleNameMapper: {
    "firebase-functions/lib/encoder":
      "<rootDir>/node_modules/firebase-functions-test/lib/providers/firestore.js",
  },
};
