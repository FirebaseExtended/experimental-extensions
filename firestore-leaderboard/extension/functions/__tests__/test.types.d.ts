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
