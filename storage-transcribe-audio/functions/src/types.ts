import { UploadResponse } from "@google-cloud/storage";

export type TranscodeAudioResult = TranscodeAudioSuccess | Failure;

export type TranscribeAudioResult = TranscribeAudioSuccess | Failure;

export interface TranscodeAudioSuccess {
  state: "success";
  sampleRateHertz: number;
  warnings: WarningType[];
  audioChannelCount: number;
  outputPath: string;
  uploadResponse: UploadResponse;
}

export interface TranscribeAudioSuccess {
  state: "success";
  warnings: WarningType[];
  transcription: Record<number, string[]>;
}

export interface Failure {
  state: "failure";
  warnings: WarningType[];
  type: FailureType;
  details?: any;
}

export enum FailureType {
  UNKNOWN = 0,
  ZERO_STREAMS = 1,
  NULL_SAMPLE_RATE = 2,
  NULL_CHANNELS = 3,
  FFMPEG_FAILURE = 4,
  NULL_TRANSCRIPTION = 5,
  TRANSCRIPTION_UPLOAD_FAILED = 6,
}

export const failureTypeToMessage: Record<FailureType, string> = {
  [FailureType.UNKNOWN]: "An unknown error occured.",
  [FailureType.ZERO_STREAMS]: "The uploaded file had zero audio streams.",
  [FailureType.NULL_SAMPLE_RATE]: "Could not obtain the file's sample rate.",
  [FailureType.NULL_CHANNELS]: "Could not obtain the file's channels.",
  [FailureType.FFMPEG_FAILURE]: "An ffmpeg error ocurred.",
  [FailureType.NULL_TRANSCRIPTION]: "Received a null transcription from API.",
  [FailureType.TRANSCRIPTION_UPLOAD_FAILED]:
    "An error ocurred when uploading " + "the transcription.",
};

export enum WarningType {
  UNKNOWN = 0,
  MORE_THAN_ONE_STREAM = 1,
  EMPTY_TRANSCRIPTION = 2,
}

export const warningTypeToMessage: Record<WarningType, string> = {
  [WarningType.UNKNOWN]: "An unknown warning occured.",
  [WarningType.MORE_THAN_ONE_STREAM]:
    "The uploaded file had more than one stream.",
  [WarningType.EMPTY_TRANSCRIPTION]:
    "The transcription is an empty string. " +
    "\nIf this is not expected, the language code may be wrong, the file may " +
    "be too noisy, or the sample rate of the original file may be too low.",
};
