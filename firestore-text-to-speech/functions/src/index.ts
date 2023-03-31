import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getFunctions } from "firebase-admin/functions";
import config from "./config";
import * as tts from "@google-cloud/text-to-speech";
import { Bucket } from "@google-cloud/storage";


const logger = functions.logger;

admin.initializeApp();

const ttsClient = new tts.TextToSpeechClient();

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
        const text = data.text as string
        const id = data.id as string

        try {
            const speech = await textToSpeech(text);
            if (speech && speech.audioContent) {
                // Merge the address validity data with the address document.

                const bucket = admin.storage().bucket();
                const file = bucket.file(id + ".mpeg");

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
            await enqueueTask(snap.data().text, snap.id);
        }
        return;
    });



async function enqueueTask(text: string, docId: string) {
    // Retry the request if it fails.
    const queue = getFunctions().taskQueue(
        `ext-${process.env.EXT_INSTANCE_ID}-processText`
    );
    await queue.enqueue(
        {
            text: text,
            id: docId,
        },
        // Retry the request after 60 seconds.
        { scheduleDelaySeconds: 60 }
    );
}

async function textToSpeech(text: string) {

    const ssmlGender = tts.protos.google.cloud.texttospeech.v1.SsmlVoiceGender.NEUTRAL;
    const audioEncoding = tts.protos.google.cloud.texttospeech.v1.AudioEncoding.MP3;

    // Construct the request
    const request = {
        input: { text: text },
        // Select the language and SSML voice gender (optional)
        voice: { languageCode: 'en-US', ssmlGender },
        // select the type of audio encoding
        audioConfig: { audioEncoding },
    };
    let response: tts.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;
    // Performs the text-to-speech request
    try {

        [response] = await ttsClient.synthesizeSpeech(request);
    } catch (e) {
        logger.warn(e);
    }
    logger.log(JSON.stringify(response));
    return response;
};