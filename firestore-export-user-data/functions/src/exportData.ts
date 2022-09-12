import admin from "firebase-admin";
import { parseAsync } from "json2csv";
import fs from "fs";
import * as os from "os";
import * as path from "path";

import config from "./config";

export const ExportDocumentData = async (
  document: admin.firestore.DocumentReference<admin.firestore.DocumentData>,
  uid: string
) => {
  const documentData = await document.get();
  var bucket = admin.storage().bucket(config.storageBucket);

  const options = {
    destination: `${document.id}.csv`,
    metadata: {
      collection: document.id,
    },
  };

  const filename = `${document.id}.csv`;

  const output = await parseAsync(documentData);
  const csvFile = path.join(os.tmpdir(), filename);

  return new Promise((resolve, reject) => {
    /* Create a temporary file */
    fs.writeFile(csvFile, output, (error) => {
      if (error) {
        reject(error);
        return;
      }
    });

    /* Upload the file */
    bucket
      .upload(csvFile, options)
      .then(() => resolve(true))
      .catch((error) => reject(error));
  });
};

export const ExportCollectionData = async (location: string, uid: string) => {
  const snapshot = await admin.firestore().collection(location).get();

  const documents = snapshot.docs.map((doc) => doc.data());

  var bucket = admin.storage().bucket(config.storageBucket);

  const options = {
    destination: `${uid}.csv`,
    metadata: {
      collection: uid,
    },
  };

  const filename = `${uid}.csv`;

  const output = await parseAsync(documents);
  const csvFile = path.join(os.tmpdir(), filename);

  return new Promise((resolve, reject) => {
    /* Create a temporary file */
    fs.writeFile(csvFile, output, (error) => {
      if (error) {
        reject(error);
        return;
      }
    });

    /* Upload the file */
    bucket
      .upload(csvFile, options)
      .then(() => resolve(true))
      .catch((error) => reject(error));
  });
};
