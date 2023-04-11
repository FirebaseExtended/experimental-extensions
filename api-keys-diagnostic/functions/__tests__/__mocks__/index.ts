import { logger } from "firebase-functions";
import { getEventarc } from "firebase-admin/eventarc";

export const apiKeysClientMock = {
  projects: {
    locations: {
      keys: {
        list: jest.fn(),
      },
    },
  },
};

export const authClientMock = {
  getClient: jest.fn(),
};

export const mockGoogleApis = {
  google: {
    auth: {
      GoogleAuth: jest.fn(),
    },
  },
  apikeys_v2: {
    Apikeys: jest.fn(() => {
      return {
        projects: {
          locations: {
            keys: {
              list: jest.fn(),
            },
          },
        },
      };
    }),
  },
};

export const mockEventArc = {
  getEventarc: jest.fn(() => {
    return {
      channel: jest.fn((channelId) => {
        return {
          publish: jest.fn(),
        };
      }),
    };
  }),
};

/** Logger listeners */
export const infoSpy = jest.spyOn(logger, "info");
export const logSpy = jest.spyOn(logger, "log");
