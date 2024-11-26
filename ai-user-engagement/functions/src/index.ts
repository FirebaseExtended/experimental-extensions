/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as functions from "firebase-functions";
import {enableFirebaseTelemetry} from "@genkit-ai/firebase";
import {
  FirebaseUserEngagement,
  FirebaseUserEngagementSchema as Schema,
  collectUserEngagement}
  from "@genkit-ai/firebase/user_engagement";

enableFirebaseTelemetry();

if (process.env.FUNCTION_MODE?.startsWith("CALLABLE")) {
  const options =
      process.env.FUNCTION_MODE === "CALLABLE_APP_CHECK" ?
        {enforceAppCheck: true} : {};
  exports.collectEngagement = functions
    .runWith(options)
    .https.onCall(async (data) => {
      let input: FirebaseUserEngagement|null = null;
      try {
        input = Schema.parse(data);
      } catch (e) {
        throw new functions.https.HttpsError(
          "invalid-argument", "Could not parse input");
      }
      await collectUserEngagement(input);
      return {};
    });
} else {
  exports.collectEngagement = functions.https.onRequest(
    async (req: functions.Request, res: functions.Response) => {
      const input = Schema.parse(req.body);
      await collectUserEngagement(input);
      res.send({});
    });
}
