import { SpeechClient } from "@google-cloud/speech";
import { google } from "@google-cloud/speech/build/protos/protos";
import { Bucket } from "@google-cloud/storage";
import * as ffmpeg from "fluent-ffmpeg";

import { TranscodeAudioResult, WarningType, FailureType } from "./types";
import * as logs from "./logs";
import config from "./config";
import { probePromise, isStringArray } from "./util";

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
}): Promise<string[] | null> {
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
      gcsUri: `gs://${bucket.name}/${name}_transcript.txt`,
    },
  };

  const response = await transcribe(client, request);

  logs.receivedLongRunningRecognizeResponse(response);
  const transcript = response.results?.map(
    (result) => result?.alternatives?.[0].transcript
  );

  if (!isStringArray(transcript)) {
    logs.undefinedResultsTranscript(transcript);
    return null;
  } else {
    logs.logResponseTranscript(transcript);
    return transcript;
  }
}

export async function transcodeToLinear16(
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

  if (streams.length == 0) {
    logs.unexpectedZeroStreamCount();
    return {
      state: "failure",
      type: FailureType.ZERO_STREAMS,
      warnings,
    };
  }

  if (streams.length != 1) {
    logs.unexpectedStreamCount(streams.length);
    warnings.push(WarningType.MORE_THAN_ONE_STREAM);
  }

  if (streams[0].sample_rate == null) {
    logs.corruptedFile();
    return {
      state: "failure",
      type: FailureType.NULL_SAMPLE_RATE,
      warnings,
    };
  }

  if (streams[0].channels == null) {
    logs.corruptedFile();
    return {
      state: "failure",
      type: FailureType.NULL_CHANNELS,
      warnings,
    };
  }

  const localOutputPath = localCopyPath + TRANSCODE_TARGET_FILE_EXTENSION;
  logs.debug("transcoding locally");
  await transcodeLocally({
    inputPath: localCopyPath,
    outputPath: localOutputPath,
  });
  logs.debug("finished transcoding locally");

  logs.debug("uploading file");
  const uploadResponse = await bucket.upload(localOutputPath, {
    destination: "out.wav",
    metadata: { metadata: { isTranscodeOutput: true } },
    // TODO(reao): add metadata
  });
  logs.debug("uploading file");

  return {
    state: "success",
    sampleRateHertz: streams[0].sample_rate,
    audioChannelCount: streams[0].channels,
    uploadResponse,
    outputPath: "out.wav",
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
