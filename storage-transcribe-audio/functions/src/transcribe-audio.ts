import { SpeechClient } from "@google-cloud/speech";
import { google } from "@google-cloud/speech/build/protos/protos";
import { Bucket } from "@google-cloud/storage";
import * as ffmpeg from "fluent-ffmpeg";

import {
  TranscodeAudioResult,
  WarningType,
  FailureType,
  TranscribeAudioResult,
} from "./types";
import * as logs from "./logs";
import config from "./config";
import { probePromise, isTaggedStringArray, separateByTags } from "./util";

const encoding = "LINEAR16";
const TRANSCODE_TARGET_FILE_EXTENSION = ".wav";

export async function transcribeAndUpload({
  client,
  file: { bucket, name },
  sampleRateHertz,
  audioChannelCount,
}: {
  client: SpeechClient;
  file: { bucket: Bucket; name: string };
  sampleRateHertz: number;
  audioChannelCount: number;
}): Promise<TranscribeAudioResult> {
  const warnings: WarningType[] = [];
  const request: google.cloud.speech.v1.ILongRunningRecognizeRequest = {
    config: {
      encoding,
      sampleRateHertz,
      languageCode: config.languageCode,
      model: config.model,
      audioChannelCount,
    },

    audio: {
      uri: `gs://${bucket.name}/${name}`,
    },

    outputConfig: {
      gcsUri: `gs://${bucket.name}/${name}_transcription.txt`,
    },
  };

  const response = await transcribe(client, request);

  if (response.outputError) {
    return {
      state: "failure",
      warnings,
      type: FailureType.TRANSCRIPTION_UPLOAD_FAILED,
      details: {
        outputUri: response.outputConfig?.gcsUri,
        outputError: response.outputError,
      },
    };
  }

  logs.receivedLongRunningRecognizeResponse(response);
  const taggedTranscription = response.results?.map(
    (result) =>
      [result?.channelTag, result?.alternatives?.[0].transcript] as const
  );

  if (!isTaggedStringArray(taggedTranscription)) {
    return {
      state: "failure",
      warnings,
      type: FailureType.NULL_TRANSCRIPTION,
    };
  }

  // I simplify the transcription compared to the one that's usually given
  // by the cloud call because, for example, we don't give the option
  // to request many candidate transcriptions from speech to text.
  //
  // However, the simplification doesn't happen for the file uploaded by the API
  // Should I
  // (a) just not simplify?
  // (b) simplify after the upload has succeeded?
  // (c) simplify, then upload (without harnessing the upload of the cloud API)?
  // (d) simplify, keeping the mildly inconsistent behavior?
  const transcription = separateByTags(taggedTranscription);

  logs.logResponseTranscription(transcription);
  return {
    state: "success",
    warnings,
    transcription,
  };
}

export async function transcodeToLinear16AndUpload(
  {
    localCopyPath,
    storageOutputPath,
  }: { localCopyPath: string; storageOutputPath: string },
  bucket: Bucket
): Promise<TranscodeAudioResult> {
  const probeData: ffmpeg.FfprobeData = await probePromise(localCopyPath);
  const warnings: WarningType[] = [];

  logs.debug("probe data before transcription:", probeData);
  const { streams } = probeData;

  if (streams.length === 0) {
    return {
      state: "failure",
      type: FailureType.ZERO_STREAMS,
      warnings,
    };
  }

  if (streams.length !== 1) {
    warnings.push(WarningType.MORE_THAN_ONE_STREAM);
  }

  if (streams[0].sample_rate == null) {
    return {
      state: "failure",
      type: FailureType.NULL_SAMPLE_RATE,
      warnings,
    };
  }

  if (streams[0].channels == null) {
    return {
      state: "failure",
      type: FailureType.NULL_CHANNELS,
      warnings,
    };
  }

  const localOutputPath = localCopyPath + TRANSCODE_TARGET_FILE_EXTENSION;
  logs.debug("transcoding locally");
  try {
    await transcodeLocally({
      inputPath: localCopyPath,
      outputPath: localOutputPath,
    });
  } catch (error: unknown) {
    const { err, stdout, stderr } = error as {
      err: any;
      stdout: string;
      stderr: string;
    };
    return {
      state: "failure",
      type: FailureType.FFMPEG_FAILURE,
      warnings,
      details: {
        ffmpegError: err,
        ffmpegStdout: stdout,
        ffmpegStderr: stderr,
      },
    };
  }
  logs.debug("finished transcoding locally");

  logs.debug("uploading transcoded file");
  const uploadResponse = await bucket.upload(localOutputPath, {
    destination: storageOutputPath,
    metadata: { metadata: { isTranscodeOutput: true } },
  });
  logs.debug("uploaded transcoded file");

  return {
    state: "success",
    sampleRateHertz: streams[0].sample_rate,
    audioChannelCount: streams[0].channels,
    uploadResponse,
    outputPath: storageOutputPath,
    warnings,
  };
}

async function transcodeLocally({
  inputPath,
  outputPath,
}: {
  inputPath: string;
  outputPath: string;
}): Promise<string> {
  // Save input to output path, converting it to the format of
  // outputPath
  return new Promise((resolve, reject) => {
    ffmpeg({ source: inputPath })
      .save(outputPath)
      .on("error", (err, stdout, stderr) => {
        reject({ err, stdout, stderr });
      })
      .on("end", (stdout, stderr) => {
        if (stdout) logs.ffmpegStdout(stdout);
        if (stderr) logs.ffmpegStderr(stderr);
        resolve(outputPath);
      });
  });
}

async function transcribe(
  client: SpeechClient,
  request: google.cloud.speech.v1.ILongRunningRecognizeRequest
): Promise<google.cloud.speech.v1.ILongRunningRecognizeResponse> {
  const [operation] = await client.longRunningRecognize(request);

  const [response] = await operation.promise();
  return response;
}
