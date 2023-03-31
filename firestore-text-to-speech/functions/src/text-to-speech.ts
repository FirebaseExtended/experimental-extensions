import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import * as admin from "firebase-admin";
import { Bucket } from "@google-cloud/storage";


// export async function synthesizeAndUploadAudio(client : TextToSpeechClient ,bucket: Bucket,text : string, languageCode , fileName) {
//     // Set the input text and voice properties
//     const request = {
//       input: { text: text },
//       voice: { languageCode: languageCode, ssmlGender: 'NEUTRAL' },
//     };
  
//     // Synthesize the speech
//     const [response] = await client.synthesizeSpeech(request, { voice: { languageCode: languageCode, ssmlGender: 'NEUTRAL' } });

//     const audioBuffer = Buffer.from(response.audioContent);
  
//     // Upload the audio buffer to Google Cloud Storage
//     const file = bucket.file(fileName);

//     await file.save(audioBuffer, {
//       metadata: { contentType: 'audio/mpeg' },
//     });
  
//     console.log(`Audio file '${fileName}' uploaded to bucket '${bucket.name}'`);
//   }