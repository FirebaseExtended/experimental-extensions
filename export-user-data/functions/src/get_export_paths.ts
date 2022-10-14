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

import config from "./config";
import * as log from "./logs";
import { fetchFromCustomHook } from "./utils";
export interface ExportPaths {
  firestorePaths: unknown[];
  databasePaths: unknown[];
  storagePaths: unknown[];
}

const emptyPaths: ExportPaths = {
  firestorePaths: [],
  databasePaths: [],
  storagePaths: [],
};

/**
 * gets paths from config and custom hooks when specified.
 * @param uid userId
 * @returns ExportPaths
 */
export async function getExportPaths(uid: string): Promise<ExportPaths> {
  let firestorePaths = [];
  let databasePaths = [];
  let storagePaths = [];

  if (config.customHookEndpoint) {
    const pathsFromCustomHook = await getPathsFromCustomHook(uid);

    firestorePaths = [...firestorePaths, ...pathsFromCustomHook.firestorePaths];
    databasePaths = [...databasePaths, ...pathsFromCustomHook.databasePaths];
    storagePaths = [...storagePaths, ...pathsFromCustomHook.storagePaths];
  } else {
    log.customHookNotConfigured();
  }

  if (config.firestorePaths || config.databasePaths || config.storagePaths) {
    const pathsFromConfig = getPathsFromConfig(uid);
    firestorePaths = [...firestorePaths, ...pathsFromConfig.firestorePaths];
    databasePaths = [...databasePaths, ...pathsFromConfig.databasePaths];
    storagePaths = [...storagePaths, ...pathsFromConfig.storagePaths];
  }
  return {
    firestorePaths,
    databasePaths,
    storagePaths,
  };
}

/**
 * gets paths from config when specified.
 * @param uid userId
 * @returns ExportPaths
 */
function getPathsFromConfig(uid: string): ExportPaths {
  let firestorePathsList: string[] = [];
  let databasePathsList: string[] = [];
  let storagePathsList: string[] = [];

  if (config.firestorePaths) {
    firestorePathsList = config.firestorePaths.split(",");
  } else {
    log.firestoreConfigPathsNotConfigured();
  }

  if (config.databasePaths) {
    databasePathsList = config.databasePaths.split(",");
  } else {
    log.rtdbConfigPathsNotConfigured();
  }

  if (config.storagePaths) {
    storagePathsList = config.storagePaths.split(",");
  } else {
    log.storageConfigPathsNotConfigured();
  }

  return {
    firestorePaths: firestorePathsList,
    databasePaths: databasePathsList,
    storagePaths: storagePathsList,
  };
}

/**
 * gets paths from custom hook when specified.
 * @param uid userId
 * @returns ExportPaths
 */
async function getPathsFromCustomHook(uid: string): Promise<ExportPaths> {
  const response = await fetchFromCustomHook(uid);

  if (!response.ok) {
    log.customHookBadResponse(config.customHookEndpoint);
    return emptyPaths;
  }

  let data: ValidatedReponseJson;

  try {
    const parsedData = JSON.parse(await response.text());
    data = validateResponseJson(parsedData);
  } catch (e) {
    log.customHookInvalidData(config.customHookEndpoint);
    return emptyPaths;
  }

  const firestorePaths = data.firestorePaths || [];
  const databasePaths = data.databasePaths || [];
  const storagePaths = data.storagePaths || [];

  return {
    firestorePaths,
    databasePaths,
    storagePaths,
  };
}

/** At this point we don't know if the custom hook has replied with string arrays, hence unknown[].
 * We skip any non-string values later, and log a warning
 */
interface ValidatedReponseJson {
  firestorePaths?: unknown[];
  databasePaths?: unknown[];
  storagePaths?: unknown[];
}

function validateResponseJson(
  data: Record<string, unknown>
): ValidatedReponseJson {
  if (data.firestorePaths && !Array.isArray(data.firestorePaths)) {
    throw new Error();
  }
  if (data.databasePaths && !Array.isArray(data.databasePaths)) {
    throw new Error();
  }
  if (data.storagePaths && !Array.isArray(data.storagePaths)) {
    throw new Error();
  }
  return data as ValidatedReponseJson;
}
