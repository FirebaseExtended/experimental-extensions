import { AxiosError, AxiosResponse, AxiosRequestHeaders } from "axios";

export function createMockAxiosError(
  data: any,
  message: string,
  status: number,
  statusText: string
): AxiosError {
  const error = new Error(message) as AxiosError;

  const response: AxiosResponse = {
    data,
    status,
    statusText,
    headers: {},
    config: {
      url: "",
      method: "get",
      //@ts-ignore
      headers: {} as Partial<AxiosRequestHeaders>,
      baseURL: "",
      timeout: 0,
      responseType: "json",
      maxContentLength: -1,
      validateStatus: () => true,
      maxBodyLength: -1,
    },
  };

  error.response = response;
  error.isAxiosError = true;
  return error;
}
