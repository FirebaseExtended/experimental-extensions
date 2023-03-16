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

declare namespace NodeJS {
  interface Global {
    config: () => jest.ModuleMocker;
    snapshot: (
      data?: { score?: number; user_name?: string; changed?: number },
      path?: string
    ) => any;
    mockDocumentSnapshotFactory: (
      documentSnapshot: any
    ) => jest.MockedFunction<any>;
    mockFirestoreUpdate: jest.MockedFunction<any>;
    mockFirestoreTransaction: jest.MockedFunction<any>;
    mockUpdateLeaderboard: jest.MockedFunction<any>;
    mockUpdateClassMethod: jest.MockedFunction<any>;
    clearMocks: () => void;
  }
}
