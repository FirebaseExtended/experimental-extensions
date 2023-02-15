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
exports.cancelTask = exports.enqueueTask = void 0;
const tasks = require("@google-cloud/tasks");
const config_1 = require("./config");
const client = new tasks.CloudTasksClient();
async function enqueueTask(address, docId) {
    // Retry the request if it fails.
    // const queue = getFunctions().taskQueue(
    //   `locations/${config.location}/functions/ext-${process.env.EXT_INSTANCE_ID}-updateLatLong`
    // );
    const queue = client.queuePath(config_1.default.projectId, config_1.default.location, `ext-${process.env.EXT_INSTANCE_ID}-updateLatLong`);
    // Convert message to buffer.
    const convertedPayload = JSON.stringify({
        address: address,
        docId: docId,
    });
    const body = Buffer.from(convertedPayload).toString("base64");
    const url = `https://${config_1.default.location}-${config_1.default.projectId}.cloudfunctions.net/ext-${process.env.EXT_INSTANCE_ID}-updateLatLong`;
    const after29Days = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);
    const [response] = await client.createTask({
        parent: queue,
        task: {
            scheduleTime: {
                seconds: after29Days.getTime() / 1000,
            },
            httpRequest: {
                httpMethod: "POST",
                oidcToken: {
                    serviceAccountEmail: `ext-${config_1.default.instanceId}@${config_1.default.projectId}.iam.gserviceaccount.com`,
                },
                headers: {
                    "Content-Type": "application/json",
                },
                url: url,
                body: body,
            },
        },
    });
    return response.name;
}
exports.enqueueTask = enqueueTask;
async function cancelTask(taskId) {
    await client.deleteTask({
        name: taskId,
    });
}
exports.cancelTask = cancelTask;
