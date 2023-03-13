import { SpeechClient } from "@google-cloud/speech";
import { google } from "@google-cloud/speech/build/protos/protos";
import { Bucket } from "@google-cloud/storage";
import * as ffmpeg from "fluent-ffmpeg";

import {
  TranscodeAudioResult,
  WarningType,
  FailureType,
  TranscribeAudioResult,
  Status,
  UploadAudioResult,
} from "./types";
import * as logs from "./logs";
import config from "./config";
import { probePromise, separateByTags, isNullFreeList, getTaggedTranscriptionOrNull } from "./util";

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
  const inputUri = `gs://${bucket.name}/${name}`;
  const outputUri = `gs://${bucket.name}/${name}_transcription.txt`;
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
      uri: inputUri,
    },

    outputConfig: {
      gcsUri: outputUri,
    },
  };

  const response = await transcribe(client, request);

  if (response.outputError) {
    return {
      status: Status.FAILURE,
      warnings,
      type: FailureType.TRANSCRIPTION_UPLOAD_FAILED,
      details: {
        outputUri: response.outputConfig?.gcsUri,
        outputError: response.outputError,
      },
    };
  }

  logs.receivedLongRunningRecognizeResponse(response);
  if (response.results == null) {
    return {
      status: Status.FAILURE,
      warnings,
      type: FailureType.NULL_TRANSCRIPTION,
    };
  }

  // Intermediate step prior to proper simplification
  const taggedTranscription: ([number, string]|null)[] = response.results.map(getTaggedTranscriptionOrNull)

  if (!isNullFreeList(taggedTranscription)) {
    return {
      status: Status.FAILURE,
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
    status: Status.SUCCESS,
    warnings,
    transcription,
  };
}

export async function transcodeToLinear16(
  localTmpPath: string,
): Promise<TranscodeAudioResult> {
  const probeData: ffmpeg.FfprobeData = await probePromise(localTmpPath);
  const warnings: WarningType[] = [];

  logs.debug("probe data before transcription:", probeData);
  const { streams } = probeData;

  if (streams.length === 0) {
    return {
      status: Status.FAILURE,
      type: FailureType.ZERO_STREAMS,
      warnings,
    };
  }

  if (streams.length !== 1) {
    warnings.push(WarningType.MORE_THAN_ONE_STREAM);
  }

  if (streams[0].sample_rate == null) {
    return {
      status: Status.FAILURE,
      type: FailureType.NULL_SAMPLE_RATE,
      warnings,
    };
  }

  if (streams[0].channels == null) {
    return {
      status: Status.FAILURE,
      type: FailureType.NULL_CHANNELS,
      warnings,
    };
  }

  const localTranscodedPath = localTmpPath + TRANSCODE_TARGET_FILE_EXTENSION;
  logs.debug("transcoding locally");
  try {
    await transcodeLocally({
      inputPath: localTmpPath,
      outputPath: localTranscodedPath,
    });
  } catch (error: unknown) {
    const { err, stdout, stderr } = error as {
      err: any;
      stdout: string;
      stderr: string;
    };
    return {
      status: Status.FAILURE,
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

  return {
    status: Status.SUCCESS,
    sampleRateHertz: streams[0].sample_rate,
    audioChannelCount: streams[0].channels,
    outputPath: localTranscodedPath,
    warnings,
  };
}

export async function uploadTranscodedFile({localPath, storagePath, bucket}: {localPath: string; storagePath: string; bucket: Bucket}): Promise<UploadAudioResult> {
  try {
    const uploadResponse = await bucket.upload(localPath, {
      destination: storagePath,
      metadata: { metadata: { isTranscodeOutput: true } },
    })

    return {
      status: Status.SUCCESS,
      uploadResponse,
    };

  } catch(err: unknown) {
    return {
      status: Status.FAILURE,
      warnings: [],
      type: FailureType.TRANSCODED_UPLOAD_FAILED,
      details: err,
    }
  }
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
