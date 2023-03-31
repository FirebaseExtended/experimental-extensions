"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textToSpeechTrigger = exports.processText = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const functions_1 = require("firebase-admin/functions");
const config_1 = require("./config");
const tts = require("@google-cloud/text-to-speech");
const logger = functions.logger;
admin.initializeApp();
const ttsClient = new tts.TextToSpeechClient();
exports.processText = functions
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
    const text = data.text;
    const id = data.id;
    try {
        const speech = await textToSpeech(text);
        if (speech && speech.audioContent) {
            // Merge the address validity data with the address document.
            const bucket = admin.storage().bucket();
            const file = bucket.file(id + ".mpeg");
            await file.save(Buffer.from(speech.audioContent));
            return;
        }
    }
    catch (error) {
        throw error;
    }
});
exports.textToSpeechTrigger = functions.firestore
    .document(`${config_1.default.collectionPath}/{docId}`)
    .onCreate(async (snap, _) => {
    if (snap.data().text) {
        await enqueueTask(snap.data().text, snap.id);
    }
    return;
});
async function enqueueTask(text, docId) {
    // Retry the request if it fails.
    const queue = (0, functions_1.getFunctions)().taskQueue(`ext-${process.env.EXT_INSTANCE_ID}-processText`);
    await queue.enqueue({
        text: text,
        id: docId,
    }, 
    // Retry the request after 60 seconds.
    { scheduleDelaySeconds: 60 });
}
async function textToSpeech(text) {
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
    let response;
    // Performs the text-to-speech request
    try {
        [response] = await ttsClient.synthesizeSpeech(request);
    }
    catch (e) {
        logger.warn(e);
    }
    logger.log(JSON.stringify(response));
    return response;
}
;
