import { Timestamp } from "@google-cloud/firestore";

import { Constants } from "../src/constants";
import { isStaleEvent } from "./../src/mirror";

const nonExistantSnapshot: any = {
  exists: false,
  ref: { path: "test non-existent document" },
  data: jest.fn(() => {
    throw new Error("Should not access Snapshot data");
  }),
};
const documentSnapshot: any = {
  exists: true,
  ref: { path: "test document" },
  data: jest.fn(() => {
    return {
      [Constants.lastEventField]: Timestamp.now(),
      [Constants.gcsMetadataField]: {},
    };
  }),
};
const tombstoneSnapshot: any = {
  exists: true,
  ref: { path: "test tombstone document" },
  data: jest.fn(() => {
    return {
      [Constants.lastEventField]: Timestamp.now(),
      [Constants.gcsMetadataField]: {},
    };
  }),
};

describe("isStaleEvent", () => {
  test("document does not exist", () => {
    const documentData = {
      [Constants.lastEventField]: Timestamp.now(),
      [Constants.gcsMetadataField]: {},
    };
    expect(isStaleEvent(nonExistantSnapshot, documentData, false)).toBe(false);
  });

  test("incoming document is older", () => {
    const documentData = {
      [Constants.lastEventField]: Timestamp.fromMillis(
        new Date().getTime() - 24 * 3600
      ),
      [Constants.gcsMetadataField]: {},
    };
    expect(isStaleEvent(documentSnapshot, documentData, false)).toBe(true);
  });

  test("incoming document is newer", () => {
    const documentData = {
      [Constants.lastEventField]: Timestamp.fromMillis(
        new Date().getTime() + 24 * 3600
      ),
      [Constants.gcsMetadataField]: {},
    };
    expect(isStaleEvent(documentSnapshot, documentData, false)).toBe(false);
  });
});
