import * as functionsTestInit from "firebase-functions-test";

export const mockUpdateLeaderboard = () => {
  let functionsTest = functionsTestInit();
  return functionsTest.wrap(require("../../src").onScoreUpdate);
};

export const mockUpdateClassMethod = jest
  .fn()
  .mockImplementation((score: number) => {
    return Promise.resolve();
  });

export const mockUpdateClass = jest.fn().mockImplementation(() => {
  return { update: mockUpdateClassMethod };
});

export function mockUpdateModuleFactory() {
  return {
    UpdateClass: mockUpdateClass,
  };
}
