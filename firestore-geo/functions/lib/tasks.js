"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueTask = void 0;
const functions_1 = require("firebase-admin/functions");
const tasks = require("@google-cloud/tasks");
const config_1 = require("./config");
const client = new tasks.CloudTasksClient();
async function enqueueTask(address, docId, scheduleDelaySeconds) {
    // Retry the request if it fails.
    const queue = (0, functions_1.getFunctions)().taskQueue(`locations/${config_1.default.location}/functions/updateLatLong`, process.env.EXT_INSTANCE_ID);
    await queue.enqueue({
        address: address,
        docId: docId,
    }, 
    // Retry the request after 30 days.
    { scheduleDelaySeconds: scheduleDelaySeconds ?? 30 * 24 * 60 * 60 });
}
exports.enqueueTask = enqueueTask;
