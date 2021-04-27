import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import * as logs from "./logs";
import { onObjectChange, mirrorObjectPath } from "./mirror";

// Initialize the Firebase Admin SDK
admin.initializeApp();

const genericHandler = async (
  object: functions.storage.ObjectMetadata,
  context: functions.EventContext
): Promise<void> => {
  logs.start();
  logs.metadata(object);
  logs.context(context);
  await onObjectChange(object, context.eventType);
};

export const mirrorFinalize = functions.storage
  .object()
  .onFinalize(genericHandler);

export const mirrorMetadataUpdate = functions.storage
  .object()
  .onMetadataUpdate(genericHandler);

export const mirrorDelete = functions.storage.object().onDelete(genericHandler);

export const mirrorArchive = functions.storage
  .object()
  .onArchive(genericHandler);

type RequestBody = {
  path: string;
};

export const mirrorObjectPathHttp = functions.handler.https.onRequest(
  async (req, res) => {
    if (req.method != "POST") {
      res.status(403).send("Forbidden!");
      return;
    }
    const path = (req.body as RequestBody).path;
    await mirrorObjectPath(path);
    res.sendStatus(200);
  }
);
