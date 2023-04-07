import {
  AudioEncoding,
  ISynthesizeSpeechRequest,
  ISynthesizeSpeechResponse,
  SsmlVoiceGender,
} from "./types";
import config from "./config";

export interface BuildRequestOptions {
  text: string;
  languageCode?: string;
  ssmlGender?: SsmlVoiceGender;
  audioEncoding?: AudioEncoding;
  voiceName?: string;
}

export function buildRequest({
  text,
  languageCode = config.languageCode,
  ssmlGender = config.ssmlGender,
  audioEncoding = config.audioEncoding,
  voiceName = config.voiceName,
}: BuildRequestOptions): ISynthesizeSpeechRequest {
  return {
    input: config.ssml ? { ssml: text } : { text: text },
    voice: voiceName ? { name: voiceName } : { languageCode, ssmlGender },
    audioConfig: {
      audioEncoding,
    },
  };
}

export function getFileExtension(audioEncoding: AudioEncoding): string {
  switch (audioEncoding) {
    case "LINEAR16":
      return ".wav";
    case "MP3":
      return ".mp3";
    case "OGG_OPUS":
      return ".ogg";
    case "MULAW":
      return ".mulaw";
    case "ALAW":
      return ".alaw";
    default:
      return ".wav";
  }
}
