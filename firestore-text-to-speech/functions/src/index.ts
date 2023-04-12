import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import config from "./config";
import * as tts from "@google-cloud/text-to-speech";
import { ISynthesizeSpeechRequest, ISynthesizeSpeechResponse } from "./types";
import { buildRequest, BuildRequestOptions, getFileExtension } from "./util";

const logger = functions.logger;

admin.initializeApp();

const ttsClient = new tts.TextToSpeechClient();

export const textToSpeech = functions.firestore
  .document(`${config.collectionPath}/{docId}`)
  .onCreate(async (snap, _) => {
    if (snap.data().text) {
      const { text, languageCode, ssmlGender, audioEncoding, voiceName } =
        snap.data() as BuildRequestOptions;

      const request = config.enablePerDocumentOverrides
        ? buildRequest({
            text,
            languageCode,
            ssmlGender,
            audioEncoding,
            voiceName,
          })
        : buildRequest({ text });

      try {
        const speech = await processText(request);
        if (speech && speech.audioContent) {
          // Merge the address validity data with the address document.
          const fileExtension = getFileExtension(audioEncoding);

          const fileName = config.storagePath
            ? `${config.storagePath}/${snap.id}${fileExtension}`
            : `${snap.id}${fileExtension}`;

          const bucket = admin.storage().bucket(config.bucketName);

          const file = bucket.file(fileName);
          await file.save(Buffer.from(speech.audioContent));

          return;
        }
      } catch (error) {
        throw error;
      }
    }
    return;
  });

async function processText(request: ISynthesizeSpeechRequest) {
  let response: ISynthesizeSpeechResponse;
  // Performs the text-to-speech request

  try {
    //@ts-ignore
    [response] = await ttsClient.synthesizeSpeech(request);
  } catch (e) {
    logger.error(e);
    throw e;
  }
  return response;
}
