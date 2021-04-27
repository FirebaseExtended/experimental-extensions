module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "./jest.setup.js",
  globalTeardown: "./jest.teardown.js",
};
