const mockGeocode = jest.fn();
const mockDistanceMatrix = jest.fn();
const mockCreateConnection = jest.fn();
const mockCreateQueryJob = jest.fn();
const mockSetProcessingState = jest.fn();

import * as fft from "firebase-functions-test";
import { logger } from "firebase-functions";
import * as functions from "../src";
import setupEnvironment from "./setupEnvironment";

jest.mock("@googlemaps/google-maps-services-js", () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      geocode: mockGeocode,
      distancematrix: mockDistanceMatrix,
    })),
  };
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

/* Mock Loggers */
const infoSpy = jest.spyOn(logger, "info");

/** Setup functions tests */
const testEnv = fft({ projectId: "demo-test" });
setupEnvironment();

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("BigQuery geo functions", () => {
  describe("getLatLong", () => {
    it("should successfully get a lonitude and latitude", (done) => {
      /** Setup mock data */
      mockGeocode.mockImplementation(() => {
        return {
          data: {
            results: [
              {
                geometry: {
                  location: { longitude: 1, latitude: 2 },
                },
              },
            ],
          },
        };
      });

      /** Setup the http request and expectations */
      const req = { body: { calls: [[{ row1: [{ foo: "bar" }] }]] } };
      const res = {
        status: () => {
          return {
            json: (data: any) => {
              console.log(data);
              expect(data.replies[0]).toBe('{"longitude":1,"latitude":2}');
              done();
            },
          };
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.getLatLong(req, res);

      /** Check results */
      expect(infoSpy).toBeCalledWith("BQ Calls ====>", [
        [{ row1: [{ foo: "bar" }] }],
      ]);
    });

    it("should add an error message if an erro is thrown", (done) => {
      /** Setup mock data */
      mockGeocode.mockImplementation(async () => {
        const error = new Error("Cannot generate latlong");
        //@ts-ignore
        error.code = 6;
        throw error;
      });

      /** Setup the http request and expectations */
      const req = { body: { calls: [[{ row1: [{ foo: "bar" }] }]] } };
      const res = {
        status: () => {
          return {
            json: (data: any) => {
              expect(data.errorMessage).toBe("Cannot generate latlong");
              done();
            },
          };
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.getLatLong(req, res);
    });
  });

  describe("getDrivingTime", () => {
    it("should successfully get a lonitude and latitude", (done) => {
      /** Setup mock data */
      mockDistanceMatrix.mockImplementation(() => {
        return {
          data: {
            rows: [
              {
                elements: [
                  {
                    duration: { value: 1234 },
                  },
                ],
              },
            ],
          },
        };
      });

      /** Setup the http request and expectations */
      const req = {
        body: { calls: [[{ origin: "one", destination: "two" }]] },
      };
      const res = {
        status: () => {
          return {
            json: (data: any) => {
              expect(data.replies[0]).toBe("1234");
              done();
            },
          };
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.getDrivingTime(req, res);

      /** Check results */
      expect(infoSpy).toBeCalledWith("BQ Calls ====>", [
        [{ origin: "one", destination: "two" }],
      ]);
    });

    it("should add an error message if an erro is thrown", (done) => {
      /** Setup mock data */
      mockDistanceMatrix.mockImplementation(async () => {
        const error = new Error("Cannot generate driving time");
        //@ts-ignore
        error.code = 6;
        throw error;
      });

      /** Setup the http request and expectations */
      const req = {
        body: { calls: [[{ origin: "one", destination: "two" }]] },
      };

      const res = {
        status: () => {
          return {
            json: (data: any) => {
              expect(data.errorMessage).toBe("Cannot generate driving time");
              done();
            },
          };
        },
      };

      /** Run run function */
      //@ts-ignore
      functions.getDrivingTime(req, res);
    });
  });

  describe("createBigQueryConnection", () => {
    let createBigQueryConnection: any;

    beforeAll(() => {
      createBigQueryConnection = testEnv.wrap(
        //@ts-ignore
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
        return [
          {
            getQueryResults: jest.fn().mockImplementation(() => {
              return [{ foo: "bar" }];
            }),
          },
        ];
      });

      mockSetProcessingState.mockImplementation();

      /** Run function */
      await createBigQueryConnection({});

      /** Check results */
      expect(mockCreateConnection).toBeCalledTimes(1);
      expect(infoSpy).toBeCalledWith("Connection created => ", [
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
      expect(infoSpy).toBeCalledWith(
        "Connection already exists, will continue creating functions."
      );
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
        "Connections were not created."
      );
    });
  });
});
