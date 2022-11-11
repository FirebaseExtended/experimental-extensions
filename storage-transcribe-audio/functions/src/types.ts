import { UploadResponse } from "@google-cloud/storage";

export type TranscodeAudioResult =
  | TranscodeAudioSuccess
  | TranscodeAudioFailure;
interface TranscodeAudioSuccess {
  state: "success";
  sampleRateHertz: number;
  warnings: WarningType[];
  audioChannelCount: number;
  outputPath: string;
  uploadResponse: UploadResponse;
}

interface TranscodeAudioFailure {
  state: "failure";
  warnings: WarningType[];
  type: FailureType;
}

export enum FailureType {
  UNKNOWN = 0,
  ZERO_STREAMS = 1,
  NULL_SAMPLE_RATE = 2,
  NULL_CHANNELS = 3,
}

export enum WarningType {
  UNKNOWN = 0,
  MORE_THAN_ONE_STREAM = 1,
}
