/*
 * Copyright 2020 Google LLC
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

import { FirebaseOptions } from "firebase/app";
import { google } from "googleapis";
import config from "./config";

const firebase = google.firebase("v1beta1");

const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/firebase.readonly"],
});

export async function getWebConfigByAppId(
  appId: string
): Promise<FirebaseOptions> {
  const res = await firebase.projects.webApps.getConfig({
    auth: await auth.getClient(),
    name: `projects/${config.projectId}/webApps/${appId}/config`,
  });

  return res.data;
}

export async function getWebConfigByList(): Promise<FirebaseOptions> {
  const res = await firebase.projects.webApps.list({
    auth: await auth.getClient(),
    pageSize: 1,
    parent: `projects/${config.projectId}`,
  });

  if (res.data.apps.length === 0) {
    throw Error("Project has no web apps");
  }

  return res.data.apps[0];
}
