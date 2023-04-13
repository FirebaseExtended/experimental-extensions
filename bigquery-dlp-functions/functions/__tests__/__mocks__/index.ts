export function createMockDeidentifyContentResponse(itemType: any, value: any) {
  return [
    {
      item: {
        [itemType]: value,
      },
    },
  ];
}

export const mockProtos = {
  google: {
    privacy: {
      dlp: {
        v2: {
          FieldId: {
            create: jest.fn().mockImplementation(() => {
              return { test: "data" };
            }),
          },
          Table: {
            Row: {
              create: jest.fn().mockImplementation(() => {
                return { test: "data" };
              }),
            },
          },
          Value: {
            create: jest.fn().mockImplementation(() => {
              return { test: "data" };
            }),
          },
        },
      },
    },
  },
};

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
