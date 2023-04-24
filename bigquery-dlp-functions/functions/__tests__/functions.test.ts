/** Set dynamic mocking modules */
const mockDeidentityContent = jest.fn();
const mockCreateConnection = jest.fn();
const mockCreateQueryJob = jest.fn();
const mockSetProcessingState = jest.fn();

import {
  createMockDeidentifyContentResponse,
  getFunctions,
  mockProtos,
} from "./__mocks__";

const fft = require("firebase-functions-test");
import { DlpServiceClient } from "@google-cloud/dlp";
import mockedConfig from "../src/config";
import { logger } from "firebase-functions";
import * as functions from "../src/index";
import setupEnvironment from "./setupEnvironment";

const testEnv = fft({ projectId: "demo-test" });

/** Mock imported modules */
jest.mock("../src/config");

jest.mock("firebase-admin/functions", () => {
  return { getFunctions };
});

jest.mock("firebase-admin/extensions", () => {
  return {
    getExtensions: jest.fn().mockImplementation(() => ({
      runtime: jest.fn().mockImplementation(() => ({
        setProcessingState: mockSetProcessingState,
      })),
    })),
  };
});

jest.mock("@google-cloud/bigquery", () => {
  return {
    BigQuery: jest.fn().mockImplementation(() => ({
      createQueryJob: mockCreateQueryJob,
    })),
  };
});

jest.mock("@google-cloud/bigquery-connection", () => {
  return {
    ConnectionServiceClient: jest.fn().mockImplementation(() => ({
      createConnection: mockCreateConnection,
    })),
  };
});

jest.mock("@google-cloud/dlp", () => {
  return {
    DlpServiceClient: jest.fn().mockImplementation(() => ({
      deidentifyContent: mockDeidentityContent,
    })),
    protos: { ...mockProtos },
  };
});

/** Mock logging functions */
const debugSpy = jest.spyOn(logger, "debug");
const warnSpy = jest.spyOn(logger, "warn");
const infoSpy = jest.spyOn(logger, "info");

setupEnvironment();

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("BigQuery DLP Extension", () => {
  const dlpClient = new DlpServiceClient();

  describe("deidentifyData", () => {
    it("should deidentify data with valid input and a redact technique and INFO_TYPE method", (done) => {
      /* Set config data */
      mockedConfig.technique = "redact";
      mockedConfig.method = "INFO_TYPE";

      /** Configure mock responses */
      mockDeidentityContent.mockImplementation(async () => {
        return [
          {
            item: {
              value: "mock-deidentified-content",
            },
          },
        ];
      });

      /** Setup the http request and expectations */
      const req = { body: { calls: [[{ row1: [{ foo: "bar" }] }]] } };
      const res = {
        send: (data: Record<string, object>) => {
          expect(data.replies).toEqual([{ row1: "mock-deidentified-content" }]);
          done();
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.deidentifyData(req, res);

      /** Check results */
      expect(dlpClient.deidentifyContent).toHaveBeenCalled();
      expect(debugSpy).toBeCalledWith(
        "Incoming request from BigQuery",
        req.body.calls
      );
    });

    it("should deidentify data with valid input and a redact technique and RECORD method", (done) => {
      /* Set config data */
      mockedConfig.technique = "redact";
      mockedConfig.method = "RECORD";

      /** Configure mock responses */
      mockDeidentityContent.mockImplementation(async () =>
        createMockDeidentifyContentResponse("table", {
          headers: [{ name: "test_header" }],
          rows: [{ values: [{ stringValue: "testing" }] }],
        })
      );

      /** Setup the http request and expectations */
      const req = { body: { calls: [[{ row1: [{ foo: "bar" }] }]] } };
      const res = {
        send: (data: Record<string, object>) => {
          expect(data.replies).toEqual([{ test_header: "testing" }]);
          done();
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.deidentifyData(req, res);

      /** Check results */
      expect(dlpClient.deidentifyContent).toHaveBeenCalled();
      expect(debugSpy).toBeCalledWith(
        "Incoming request from BigQuery",
        req.body.calls
      );
    });

    it("should deidentify data with valid input and a fixed technique and INFO_TYPE method", (done) => {
      /* Set config data */
      mockedConfig.technique = "fixed";
      mockedConfig.method = "INFO_TYPE";

      /** Configure mock responses */
      mockDeidentityContent.mockImplementation(async () =>
        createMockDeidentifyContentResponse(
          "value",
          "mock-deidentified-content"
        )
      );

      /** Setup the http request and expectations */
      const req = { body: { calls: [[{ row1: [{ foo: "bar" }] }]] } };
      const res = {
        send: (data: Record<string, object>) => {
          expect(data.replies).toEqual([{ row1: "mock-deidentified-content" }]);
          done();
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.deidentifyData(req, res);

      /** Check results */
      expect(dlpClient.deidentifyContent).toHaveBeenCalled();
      expect(debugSpy).toBeCalledWith(
        "Incoming request from BigQuery",
        req.body.calls
      );
    });

    it("should deidentify data with valid input and a fixed technique and RECORD method", (done) => {
      /* Set config data */
      mockedConfig.technique = "fixed";
      mockedConfig.method = "RECORD";

      /** Configure mock responses */
      mockDeidentityContent.mockImplementation(async () =>
        createMockDeidentifyContentResponse("table", {
          headers: [{ name: "test_header" }],
          rows: [{ values: [{ stringValue: "testing" }] }],
        })
      );

      /** Setup the http request and expectations */
      const req = { body: { calls: [[{ row1: [{ foo: "bar" }] }]] } };
      const res = {
        send: (data: Record<string, object>) => {
          console.log(data);
          expect(data.replies).toEqual([{ test_header: "testing" }]);
          done();
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.deidentifyData(req, res);

      /** Check results */
      expect(dlpClient.deidentifyContent).toHaveBeenCalled();
      expect(debugSpy).toBeCalledWith(
        "Incoming request from BigQuery",
        req.body.calls
      );
    });

    it("should deidentify data with valid input and a replaceWithInfoType technique and INFO_TYPE method", (done) => {
      /* Set config data */
      mockedConfig.technique = "replaceWithInfoType";
      mockedConfig.method = "INFO_TYPE";

      /** Configure mock responses */
      mockDeidentityContent.mockImplementation(async () =>
        createMockDeidentifyContentResponse(
          "value",
          "mock-deidentified-content"
        )
      );

      /** Setup the http request and expectations */
      const req = { body: { calls: [[{ row1: [{ foo: "bar" }] }]] } };
      const res = {
        send: (data: Record<string, object>) => {
          expect(data.replies).toEqual([{ row1: "mock-deidentified-content" }]);
          done();
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.deidentifyData(req, res);

      /** Check results */
      expect(dlpClient.deidentifyContent).toHaveBeenCalled();
      expect(debugSpy).toBeCalledWith(
        "Incoming request from BigQuery",
        req.body.calls
      );
    });

    it("should deidentify data with valid input and a replaceWithInfoType technique and RECORD method", (done) => {
      /* Set config data */
      mockedConfig.technique = "replaceWithInfoType";
      mockedConfig.method = "RECORD";

      /** Configure mock responses */
      mockDeidentityContent.mockImplementation(async () =>
        createMockDeidentifyContentResponse("table", {
          headers: [{ name: "test_header" }],
          rows: [{ values: [{ stringValue: "testing" }] }],
        })
      );

      /** Setup the http request and expectations */
      const req = { body: { calls: [[{ row1: [{ foo: "bar" }] }]] } };
      const res = {
        send: (data: Record<string, object>) => {
          console.log(data);
          expect(data.replies).toEqual([{ test_header: "testing" }]);
          done();
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.deidentifyData(req, res);

      /** Check results */
      expect(dlpClient.deidentifyContent).toHaveBeenCalled();
      expect(debugSpy).toBeCalledWith(
        "Incoming request from BigQuery",
        req.body.calls
      );
    });

    it("should return invalid method with an unrecognised config method", (done) => {
      /* Set config data */
      mockedConfig.technique = undefined;
      mockedConfig.method = undefined;

      /** Setup the http request and expectations */
      const req = { body: { calls: [] } };
      const res = {
        status: () => {
          return {
            send: (data: Record<string, object>) => {
              expect(data.errorMessage).toBe("Invalid method");
              done();
            },
          };
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.deidentifyData(req, res);

      /** Check results */
      expect(debugSpy).toBeCalledWith("Incoming request from BigQuery", []);
    });
  });

  describe("reidentifyData", () => {
    it("should deidentify data with valid input and a redact technique and INFO_TYPE method", (done) => {
      //TODO: add tests if this fn is ready? Currently has now working case in the source code.
      expect(true).toBeTruthy();
      done();
    });
  });

  describe("createBigQueryConnection", () => {
    let createBigQueryConnection: any;

    beforeAll(() => {
      createBigQueryConnection = testEnv.wrap(
        functions.createBigQueryConnection
      );
    });

    it("should successfully create a connection", async () => {
      /** Configure mock responses */
      mockCreateConnection.mockImplementation(async () => {
        return [
          {
            connection: "example",
          },
        ];
      });

      mockCreateQueryJob.mockImplementation(async () => {
        return [{ getQueryResults: jest.fn() }];
      });

      mockSetProcessingState.mockImplementation();

      /** Run function */
      await createBigQueryConnection({});

      /** Check results */
      expect(mockCreateConnection).toBeCalledTimes(1);
      expect(infoSpy).toBeCalledWith("Connection successfully created 🎉", [
        {
          connection: "example",
        },
      ]);

      expect(mockSetProcessingState).toBeCalledWith(
        "PROCESSING_COMPLETE",
        "Connections created successfully."
      );
    });

    it("should wanrn if a conneciton already exists", async () => {
      /** Configure mock responses */
      mockCreateConnection.mockImplementation(async () => {
        const error = new Error("Connection already exists");
        //@ts-ignore
        error.code = 6;
        throw error;
      });

      /** Run function */
      await createBigQueryConnection({});

      /** Check results */
      expect(mockCreateConnection).toBeCalledTimes(1);
      expect(warnSpy).toBeCalledWith(
        "Connection ext-firestore-geo-functions already exists, will continue creating functions"
      );
    });

    it("should successfully throw an error if a function exists", async () => {
      /** Configure mock responses */
      mockCreateConnection.mockImplementation(async () => {
        return [
          {
            connection: "example",
          },
        ];
      });

      mockCreateQueryJob.mockImplementation(async () => {
        const error = new Error("Function already exists");
        //@ts-ignore
        error.code = 6;
        throw error;
      });

      /** Run function */
      await createBigQueryConnection({});

      /** Check results */
      expect(mockCreateConnection).toBeCalledTimes(1);
      expect(warnSpy).toBeCalledWith("Functions already exists.");
    });

    it("should successfully throw an error if an error code does not equal 6", async () => {
      /** Configure mock responses */
      mockCreateConnection.mockImplementation(async () => {
        return [
          {
            connection: "example",
          },
        ];
      });

      mockCreateQueryJob.mockImplementation(async () => {
        const error = new Error("Function already exists");
        //@ts-ignore
        error.code = 4;
        throw error;
      });

      /** Run function */
      await createBigQueryConnection({});

      /** Check results */
      expect(mockCreateConnection).toBeCalledTimes(1);

      expect(mockSetProcessingState).toBeCalledWith(
        "PROCESSING_FAILED",
        "Connections were not created, check logs for more details."
      );
    });
  });
});
