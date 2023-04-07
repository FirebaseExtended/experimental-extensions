import * as tts from "@google-cloud/text-to-speech";

export type ISynthesizeSpeechRequest =
  tts.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;
export type ISynthesizeSpeechResponse =
  tts.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;
export type AudioEncoding =
  | tts.protos.google.cloud.texttospeech.v1.AudioEncoding
  | "AUDIO_ENCODING_UNSPECIFIED"
  | "LINEAR16"
  | "MP3"
  | "OGG_OPUS"
  | "MULAW"
  | "ALAW";
export type SsmlVoiceGender =
  tts.protos.google.cloud.texttospeech.v1.SsmlVoiceGender;
