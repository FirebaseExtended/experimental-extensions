import * as util from "util";
import * as ffmpeg from "fluent-ffmpeg";

export function errorFromAny(anyErr: any): Error {
  let error: Error;
  if (!(anyErr instanceof Error)) {
    error = {
      name: "Thrown non-error object",
      message: String(anyErr),
    };
  } else {
    error = anyErr;
  }

  return error;
}

export function isStringArray(
  transcript: (string | null | undefined)[] | undefined
): transcript is string[] {
  return (
    transcript !== undefined &&
    transcript.every((line) => line !== undefined) &&
    transcript.every((line) => line !== null)
  );
}

export const probePromise = util.promisify<string, ffmpeg.FfprobeData>(
  ffmpeg.ffprobe
);
