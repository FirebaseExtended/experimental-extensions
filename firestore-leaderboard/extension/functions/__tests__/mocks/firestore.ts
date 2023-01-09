import * as functionsTestInit from "firebase-functions-test";

export const snapshot = (
  data = { score: 100, user_name: "mock User" },
  path = "users/id1"
) => {
  let functionsTest = functionsTestInit();
  return functionsTest.firestore.makeDocumentSnapshot(data, path);
};

export const mockDocumentSnapshotFactory = (documentSnapshot) => {
  return jest.fn().mockImplementation(() => {
    return {
      exists: true,
      get: documentSnapshot.get.bind(documentSnapshot),
      ref: { path: documentSnapshot.ref.path },
      data: { documentSnapshot },
    };
  })();
};

export const mockFirestoreTransaction = jest.fn().mockImplementation(() => {
  return (transactionHandler) => {
    transactionHandler({
      update(ref, field, data) {
        mockFirestoreUpdate(field, data);
      },
      set(ref, field, data) {
        mockFirestoreSet(field, data);
      },
    });
  };
});

export const mockFirestoreUpdate = jest.fn();
export const mockFirestoreSet = jest.fn();
