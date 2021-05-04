import {
  objectNameToFirestorePaths,
  isValidDocumentName,
  isValidDocumentId,
  mirrorDocumentPathToTombstonePath,
} from "../src/util";

const root = process.env.FIRESTORE_ROOT;
const prefixes = process.env.PREFIXES_SUBCOLLECTION_NAME;
const prefixesTombstones = process.env.PREFIXES_TOMBSTONES_NAME;
const items = process.env.ITEMS_SUBCOLLECTION_NAME;
const itemsTombstones = process.env.ITEMS_TOMBSTONES_NAME;

describe("isValidDocumentName", () => {
  test("valid names work", () => {
    const deepNestedName = "a/b".repeat(50) + "c.jpg";
    const longName = "a".repeat(6144);
    expect(isValidDocumentName(deepNestedName)).toBe(true);
    expect(isValidDocumentName(longName)).toBe(true);
  });
  test("cannot be more than 100 subcollections deep", () => {
    const name = "a/".repeat(100) + "b.jpg";
    expect(isValidDocumentName(name)).toBe(false);
  });
  test("cannot be larger than 6 KiB", () => {
    const name = "a".repeat(6144 + 1);
    expect(isValidDocumentName(name)).toBe(false);
  });
});

describe("isValidDocumentId", () => {
  test("valid names work", () => {
    const name = "foo/bar/image.jpg";
    const ids = name.split("/");
    expect(ids.every(isValidDocumentId)).toBe(true);
  });
  test("double forward-slash fails", () => {
    const name = "//";
    const ids = name.split("/");
    expect(ids.every(isValidDocumentId)).toBe(false);
  });
  test("cannot be larger than 1500 bytes", () => {
    const id = "a".repeat(1500 + 1);
    expect(isValidDocumentId(id)).toBe(false);
  });
  test("cannot match __.*__", () => {
    const id = "__image.jpg__";
    expect(isValidDocumentId(id)).toBe(false);
  });
});

describe("objectNameToFirestorePaths", () => {
  test("file at root", () => {
    const name = "a.jpg";
    const { prefixPaths, itemPath } = objectNameToFirestorePaths(name);
    expect(prefixPaths.length).toBe(0);
    expect(itemPath).toBe(`${root}/${items}/a.jpg`);
  });
  test("file in nested path", () => {
    const name = "a/b/c.jpg";
    const { prefixPaths, itemPath } = objectNameToFirestorePaths(name);
    expect(prefixPaths[0]).toBe(`${root}/${prefixes}/a`);
    expect(prefixPaths[1]).toBe(`${root}/${prefixes}/a/${prefixes}/b`);
    expect(itemPath).toBe(`${root}/${prefixes}/a/${prefixes}/b/${items}/c.jpg`);
  });
});

describe("mirrorDocumentPathToTombstonePath", () => {
  test("file in nested path", () => {
    const name = "a/b/c.jpg";
    const { prefixPaths, itemPath } = objectNameToFirestorePaths(name);
    expect(mirrorDocumentPathToTombstonePath(prefixPaths[0])).toBe(
      `${root}/${prefixesTombstones}/a`
    );
    expect(mirrorDocumentPathToTombstonePath(prefixPaths[1])).toBe(
      `${root}/${prefixes}/a/${prefixesTombstones}/b`
    );
    expect(mirrorDocumentPathToTombstonePath(itemPath)).toBe(
      `${root}/${prefixes}/a/${prefixes}/b/${itemsTombstones}/c.jpg`
    );
  });
});
