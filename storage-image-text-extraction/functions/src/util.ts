import * as functions from "firebase-functions";
import * as path from "path";
// import * as logs from './logs';
import config from "./config";

export const shouldExtractText = (
  object: functions.storage.ObjectMetadata
): boolean => {
  if (!object.name) {
    // logs.noName();
    return false;
  }
  const { contentType } = object;
  const tmpFilePath = path.resolve("/", path.dirname(object.name)); // Absolute path to dirname

  if (!contentType) {
    // logs.noContentType(object.name);
    return false;
  }
  if (
    config.includePathList &&
    !startsWithArray(config.includePathList, tmpFilePath)
  ) {
    // logs.imageOutsideOfPaths(config.includePathList, tmpFilePath);
    return false;
  }

  if (
    config.excludePathList &&
    startsWithArray(config.excludePathList, tmpFilePath)
  ) {
    // logs.imageInsideOfExcludedPaths(config.excludePathList, tmpFilePath);
    return false;
  }
  return true;
};

export const startsWithArray = (
  userInputPaths: string[],
  imagePath: string
) => {
  for (let userPath of userInputPaths) {
    const trimmedUserPath = userPath
      .trim()
      .replace(/\*/g, "([a-zA-Z0-9_\\-.\\s\\/]*)?");

    const regex = new RegExp("^" + trimmedUserPath + "(?:/.*|$)");

    if (regex.test(imagePath)) {
      return true;
    }
  }
  return false;
};
