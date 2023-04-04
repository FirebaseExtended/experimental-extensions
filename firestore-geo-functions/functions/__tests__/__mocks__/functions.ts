import * as admin from "firebase-admin";
const { Timestamp } = admin.firestore;

export const getFunctions = () => {
  return {
    taskQueue: (functionName: any, queueName: any) => {
      return {
        enqueue: async (payload: any) => {
          console.log("Enqueue payload:", payload);
        },
      };
    },
  };
};

export const getExtensions = () => {
  return {
    runtime: jest.fn().mockImplementation(() => {}),
  };
};
