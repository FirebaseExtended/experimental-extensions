import { logger } from "firebase-functions/v1";

export const noContentType = (objectName: string) => {
  logger.log(
    `File has no Content-Type, no processing is required for '${objectName}}'`
  );
};

export const contentTypeInvalid = (contentType: string, objectName: string) => {
  logger.log(
    `File of type '${contentType}' is not an image, no processing is required for ${objectName}`
  );
};

export const noName = () => {
  logger.log(`File has no name, no processing is required`);
};

export const imageOutsideOfPaths = (
  absolutePaths: string[],
  imagePath: string
) => {
  logger.log(
    `Image path '${imagePath}' is not supported, these are the supported absolute paths: ${absolutePaths.join(
      ", "
    )}`
  );
};

export const imageInsideOfExcludedPaths = (
  absolutePaths: string[],
  imagePath: string
) => {
  logger.log(
    `Image path '${imagePath}' is not supported, these are the not supported absolute paths: ${absolutePaths.join(
      ", "
    )}`
  );
};

export const imageExtractionFailed = (filePath: string) => {
  logger.log(
    `text extraction did not complete successfully on image ${filePath}`
  );
};

export const successfulImageExtraction = (filePath: string) => {
  logger.log(`text extraction completed successfully on image ${filePath}`);
};

export const noTextFound = (filePath: string) => {
  logger.log(`no text found in image ${filePath}`);
};
