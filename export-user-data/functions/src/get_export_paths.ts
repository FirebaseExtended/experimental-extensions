// fetch from a hook
import config from "./config";

export interface ExportPaths {
  firestorePaths: {
    collections: string[];
    docs: string[];
  };
  databasePaths: string[];
}

export async function getExportPaths(uid: string): Promise<ExportPaths> {
  let collections = [];
  let docs = [];
  let databasePaths = [];

  if (config.customHookEndpoint) {
    const pathsFromCustomHook = await getPathsFromCustomHook(uid);

    collections = [
      ...collections,
      ...pathsFromCustomHook.firestorePaths.collections,
    ];
    docs = [...docs, ...pathsFromCustomHook.firestorePaths.docs];
    databasePaths = [...databasePaths, ...pathsFromCustomHook.databasePaths];
  }
  if (config.firestorePaths || config.databasePaths) {
    const pathsFromConfig = getPathsFromConfig(uid);

    collections = [
      ...collections,
      ...pathsFromConfig.firestorePaths.collections,
    ];
    docs = [...docs, ...pathsFromConfig.firestorePaths.docs];
    databasePaths = [...databasePaths, ...pathsFromConfig.databasePaths];
  }

  return {
    firestorePaths: {
      collections,
      docs,
    },
    databasePaths,
  };
}

async function getPathsFromCustomHook(uid: string): Promise<ExportPaths> {
  const response = await fetch(config.customHookEndpoint, {
    method: "POST",
    body: JSON.stringify({ data: { uid } }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();

  const firestorePaths = data.firestorePaths || [];
  const databasePaths = data.databasePaths || [];

  const { passed: collections, failed: docs } = splitList<string>(
    firestorePaths,
    (path) => path.split("/").length % 2 === 1
  );

  // expect a response as a list of strings
  return {
    firestorePaths: {
      collections,
      docs,
    },
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
    databasePathsList = config.databasePaths
      .split(",")
      .map((path) => replaceUID(path, uid));
  }

  const { passed: collections, failed: docs } = splitList<string>(
    firestorePathsList,
    (path) => path.split("/").length % 2 === 1,
    (path) => replaceUID(path, uid)
  );

  return {
    firestorePaths: {
      collections,
      docs,
    },
    databasePaths: databasePathsList,
  };
}

function splitList<T>(
  list: T[],
  test: (value: T) => boolean,
  transform: (value: T) => T = (x) => x
): { passed: T[]; failed: T[] } {
  const passed = [];
  const failed = [];

  for (let item of list) {
    if (test(item)) {
      passed.push(transform(item));
    } else {
      failed.push(transform(item));
    }
  }
  return {
    passed,
    failed,
  };
}

function replaceUID(path: string, uid: string) {
  return path.replace(/{UID}/g, uid);
}
