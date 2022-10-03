import { logger } from "firebase-functions";
import config from "./config";

export function init() {
  logger.log("Initializing extension with configuration", config);
}

export function acknowledgeNotice(data: any) {
  logger.log("Acknowledged notice", data);
}

export function unacknowledgeNotice(data: any) {
  logger.log("Unacknowledged notice", data);
}
