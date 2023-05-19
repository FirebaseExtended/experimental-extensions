/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
