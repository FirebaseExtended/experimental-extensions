import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getFunctions } from "firebase-admin/functions";
import config from "./config";
import * as tts from "@google-cloud/text-to-speech";
import { AudioEncoding, ISynthesizeSpeechRequest, ISynthesizeSpeechResponse, SsmlVoiceGender } from "./types";

const logger = functions.logger;

admin.initializeApp();

const ttsClient = new tts.TextToSpeechClient();


interface BuildRequestOptions {
    text: string;
    languageCode?: string;
    ssmlGender?: SsmlVoiceGender;
    audioEncoding?: AudioEncoding;
    voiceName?: string;
}

function buildRequest({
    text,
    languageCode = config.languageCode,
    ssmlGender = config.ssmlGender,
    audioEncoding = config.audioEncoding,
    voiceName = config.voiceName
}: BuildRequestOptions): ISynthesizeSpeechRequest {
    return {
        input: config.ssml ? { ssml: text } : { text: text },
        voice: voiceName ? { name: voiceName } : {languageCode, ssmlGender},
        audioConfig: {
            audioEncoding
        }
    }
}


export const processText = functions
    .runWith({ secrets: [`ext-${process.env.EXT_INSTANCE_ID}-API_KEY`] })
    .tasks.taskQueue({
        retryConfig: {
            maxAttempts: 3,
            minBackoffSeconds: 60,
            maxDoublings: 6,
        },
        rateLimits: {
            maxConcurrentDispatches: 6,
        },
    })
    .onDispatch(async (data) => {
        const request: ISynthesizeSpeechRequest = data.request;
        const docId: string = data.docId;

        try {
            const speech = await textToSpeech(request);
            if (speech && speech.audioContent) {
                // Merge the address validity data with the address document.

                const bucket = admin.storage().bucket();
                const file = bucket.file(docId + ".mpeg");

                await file.save(Buffer.from(speech.audioContent))

                return;
            }
        } catch (error) {

            throw error;
        }
    });


export const textToSpeechTrigger = functions.firestore
    .document(`${config.collectionPath}/{docId}`)
    .onCreate(async (snap, _) => {
        if (snap.data().text) {
            const {
                text,
                languageCode,
                ssmlGender,
                audioEncoding,
                voiceName
            } = snap.data() as BuildRequestOptions;

            const request = config.enablePerDocumentOverrides ? buildRequest({
                text,
                languageCode,
                ssmlGender,
                audioEncoding,
                voiceName
            }) : buildRequest({ text });
            await enqueueTask(request, snap.id);
        }
        return;
    });



async function enqueueTask(request: ISynthesizeSpeechRequest, docId: string) {
    // Retry the request if it fails.
    const queue = getFunctions().taskQueue(
        `ext-${process.env.EXT_INSTANCE_ID}-processText`
    );
    await queue.enqueue(
        {
            request,
            docId,
        },
        // Retry the request after 60 seconds.
        { scheduleDelaySeconds: 60 }
    );
}


async function textToSpeech(request: ISynthesizeSpeechRequest) {
    let response: ISynthesizeSpeechResponse;
    // Performs the text-to-speech request
    try {

        [response] = await ttsClient.synthesizeSpeech(request);
    } catch (e) {
        logger.warn(e);
    }
    logger.log(JSON.stringify(response));
    return response;
};