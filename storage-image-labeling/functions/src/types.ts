import * as vision from "@google-cloud/vision";
export type VisionClient = vision.v1.ImageAnnotatorClient;
// this isn't exported from the sdk, and is different from IAnnotateImageRequest, but is used in the annotateImage method
export type ImprovedRequest = {
  image?: {
    source?: {
      filename?: string;
      imageUri?: string;
    };
    content?: Uint8Array | string | null;
  };
  features?: any;
  imageContext?: any;
};
export type IAnnotatedImageRequest =
  vision.protos.google.cloud.vision.v1.IAnnotateImageRequest;
export type ImageContext = vision.protos.google.cloud.vision.v1.IImageContext;
export type IAnnotatedImageResponse =
  vision.protos.google.cloud.vision.v1.IAnnotateImageResponse;
export type IEntityAnnotation =
  vision.protos.google.cloud.vision.v1.IEntityAnnotation;
