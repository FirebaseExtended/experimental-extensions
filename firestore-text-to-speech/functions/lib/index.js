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
function buildRequest({ text, languageCode = config_1.default.languageCode, ssmlGender = config_1.default.ssmlGender, audioEncoding = config_1.default.audioEncoding, voiceName = config_1.default.voiceName }) {
    return {
        input: config_1.default.ssml ? { ssml: text } : { text: text },
        voice: voiceName ? { name: voiceName } : { languageCode, ssmlGender },
        audioConfig: {
            audioEncoding
        }
    };
}
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
    const request = data.request;
    const docId = data.docId;
    try {
        const speech = await textToSpeech(request);
        if (speech && speech.audioContent) {
            // Merge the address validity data with the address document.
            const bucket = admin.storage().bucket();
            const file = bucket.file(docId + ".mpeg");
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
        const { text, languageCode, ssmlGender, audioEncoding, voiceName } = snap.data();
        const request = config_1.default.enablePerDocumentOverrides ? buildRequest({
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
async function enqueueTask(request, docId) {
    // Retry the request if it fails.
    const queue = (0, functions_1.getFunctions)().taskQueue(`ext-${process.env.EXT_INSTANCE_ID}-processText`);
    await queue.enqueue({
        request,
        docId,
    }, 
    // Retry the request after 60 seconds.
    { scheduleDelaySeconds: 60 });
}
async function textToSpeech(request) {
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
