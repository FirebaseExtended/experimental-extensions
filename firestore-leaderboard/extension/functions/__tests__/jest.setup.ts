import {
  snapshot,
  mockDocumentSnapshotFactory,
  mockFirestoreUpdate,
  mockFirestoreTransaction,
} from "./mocks/firestore";
import { mockUpdateLeaderboard, mockUpdateClassMethod } from "./mocks/update";

global.config = () => require("../src/config").default;

global.snapshot = snapshot;
global.mockDocumentSnapshotFactory = mockDocumentSnapshotFactory;
global.mockFirestoreUpdate = mockFirestoreUpdate;

global.mockFirestoreTransaction = mockFirestoreTransaction;
global.mockUpdateLeaderboard = mockUpdateLeaderboard;
global.mockUpdateClassMethod = mockUpdateClassMethod;

global.clearMocks = () => {
  mockFirestoreUpdate.mockClear();
  mockFirestoreTransaction.mockClear();
};
