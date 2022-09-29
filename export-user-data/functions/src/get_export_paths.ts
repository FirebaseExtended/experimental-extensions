// fetch from a hook
import config from "./config";
import { customHookBadResponse, customHookInvalidData } from "./logs";
import fetch from "node-fetch";
export interface ExportPaths {
  firestorePaths: unknown[];
  databasePaths: unknown[];
}

export async function getExportPaths(uid: string): Promise<ExportPaths> {
  let firestorePaths = [];
  let databasePaths = [];

  if (config.customHookEndpoint) {
    const pathsFromCustomHook = await getPathsFromCustomHook(uid);

    firestorePaths = [...firestorePaths, ...pathsFromCustomHook.firestorePaths];
    databasePaths = [...databasePaths, ...pathsFromCustomHook.databasePaths];
  }
  if (config.firestorePaths || config.databasePaths) {
    const pathsFromConfig = getPathsFromConfig(uid);

    firestorePaths = [...firestorePaths, ...pathsFromConfig.firestorePaths];
    databasePaths = [...databasePaths, ...pathsFromConfig.databasePaths];
  }

  return {
    firestorePaths,
    databasePaths,
  };
}

async function getPathsFromCustomHook(uid: string): Promise<ExportPaths> {
  const response = await fetch(config.customHookEndpoint, {
    method: "POST",
    body: JSON.stringify({ data: { uid } }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    customHookBadResponse(config.customHookEndpoint);
    return emptyPaths;
  }

  let data: ValidatedReponseJson;

  try {
    const parsedBody = JSON.parse(await response.json());
    data = validateResponseJson(parsedBody);
  } catch (e) {
    customHookInvalidData(config.customHookEndpoint);
    return emptyPaths;
  }

  const firestorePaths = data.firestorePaths || [];
  const databasePaths = data.databasePaths || [];

  return {
    firestorePaths,
    databasePaths,
  };
}

function getPathsFromConfig(uid: string): ExportPaths {
  let firestorePathsList: string[] = [];
  let databasePathsList: string[] = [];

  if (config.firestorePaths) {
    firestorePathsList = config.firestorePaths.split(",");
  }
  if (config.databasePaths) {
    databasePathsList = config.databasePaths.split(",");
  }

  return {
    firestorePaths: firestorePathsList,
    databasePaths: databasePathsList,
  };
}

interface ValidatedReponseJson {
  firestorePaths?: unknown[];
  databasePaths?: unknown[];
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
  return data as ValidatedReponseJson;
}

const emptyPaths: ExportPaths = {
  firestorePaths: [],
  databasePaths: [],
};
