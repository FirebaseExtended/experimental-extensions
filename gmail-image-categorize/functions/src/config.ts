/*
 * Copyright 2019 Google LLC
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

// Set the callback URL.
process.env.GOOGLE_CALLBACK_URL = `https://${process.env.LOCATION}-${process.env.PROJECT_ID}.cloudfunctions.net/callback`;

export default {
  gcpProject: process.env.PROJECT_ID!,
  pubsubTopic: process.env.PUBSUB_TOPIC!,
  location: process.env.LOCATION!,
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  authCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
};
