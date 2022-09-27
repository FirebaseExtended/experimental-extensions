import { logger } from "firebase-functions";
import config from "./config";

export function init() {
  logger.log("Initializing extension with configuration", config);
}