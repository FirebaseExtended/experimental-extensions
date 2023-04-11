import {
  mockGoogleApis,
  mockEventArc,
  logSpy,
  infoSpy,
  apiKeysClientMock,
  authClientMock,
} from "./__mocks__";

const functions = require("firebase-functions-test")();
const apiKeysDiagnosticModule = require("../src/index");
const { google, apikeys_v2 } = require("googleapis");

jest.mock("googleapis", () => mockGoogleApis);
jest.mock("firebase-admin/eventarc", () => mockEventArc);

/** Setup tests project variables */
// const projectId = "demo-test";

describe("apiKeysDiagnostic", () => {
  beforeEach(() => {
    /** Mock Google Authentication */
    google.auth.GoogleAuth.mockImplementation(() => authClientMock);

    /** Mock Api keys response */
    apikeys_v2.Apikeys.mockImplementation(() => apiKeysClientMock);
    authClientMock.getClient.mockResolvedValue(apiKeysClientMock);
  });

  afterEach(() => {
    functions.cleanup();
    jest.clearAllMocks();
  });

  it("should log and send an event for unsecured API keys", async () => {
    /** Add an insecure key */
    const key = {
      name: "projects/demo-test/locations/global/keys/key1",
      restrictions: null,
    };

    /** Mock api to return an unretricted key */
    apiKeysClientMock.projects.locations.keys.list.mockResolvedValue({
      data: {
        keys: [key],
      },
    });

    /** Set up the schedule function to run */
    const wrapped = functions.wrap(apiKeysDiagnosticModule.apiKeysDiagnostic);
    await wrapped();

    /** Test that the auth method was called */
    expect(authClientMock.getClient).toHaveBeenCalled();

    /** Check that the mocked key was called */
    expect(apiKeysClientMock.projects.locations.keys.list).toHaveBeenCalledWith(
      {
        parent: "projects/demo-test/locations/global",
      }
    );

    /** Test that an event has been sent */
    expect(infoSpy).toHaveBeenCalledWith("Sending event");

    /** Check that an event with the correct key has been sent */
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify([key], null, 2));
  });

  it("should not send an event if there are no unsecured API keys", async () => {
    /** Mock api to return no keys */
    apiKeysClientMock.projects.locations.keys.list.mockResolvedValue({
      data: {
        keys: null,
      },
    });

    /** Set up the schedule function to run */
    const wrapped = functions.wrap(apiKeysDiagnosticModule.apiKeysDiagnostic);
    await wrapped();

    /** Test that the auth method was called */
    expect(authClientMock.getClient).toHaveBeenCalled();

    /** Check that the mocked key was called */
    expect(apiKeysClientMock.projects.locations.keys.list).toHaveBeenCalledWith(
      {
        parent: "projects/demo-test/locations/global",
      }
    );

    /** Test that an event has been sent */
    expect(infoSpy).toHaveBeenCalledTimes(0);
  });
});
