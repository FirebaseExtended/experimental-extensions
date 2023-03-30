/*
 * Copyright 2023 Google LLC
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

import { getFunctions } from "firebase-admin/functions";
import * as tasks from "@google-cloud/tasks";
import config from "./config";

const client = new tasks.CloudTasksClient();

export async function enqueueTask(
  address: string,
  docId: string,
  scheduleDelaySeconds?: number
) {
  // Retry the request if it fails.
  const queue = getFunctions().taskQueue(
    `locations/${config.location}/functions/updateLatLong`,
    process.env.EXT_INSTANCE_ID
  );

  await queue.enqueue(
    {
      address: address,
      docId: docId,
    },
    // Retry the request after 30 days.
    { scheduleDelaySeconds: scheduleDelaySeconds ?? 30 * 24 * 60 * 60 }
  );
}
