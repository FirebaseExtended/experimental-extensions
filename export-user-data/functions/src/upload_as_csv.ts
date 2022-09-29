import * as admin from "firebase-admin";
import config from "./config";
import * as log from "./logs";
import {
  constructDatabaseCSV,
  constructFirestoreCollectionCSV,
  constructFirestoreDocumentCSV,
} from "./construct_exports";
import { ExportPaths } from "./get_export_paths";
import { replaceUID } from "./utils";

export async function uploadAsCSVs(
  exportPaths: ExportPaths,
  storagePrefix: string,
  uid: string
) {
  const promises = [];

  for (let path of exportPaths.firestorePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      if (pathWithUID.split("/").length % 2 === 1) {
        const snap = await admin.firestore().collection(pathWithUID).get();

        if (!snap.empty) {
          log.firestorePathExporting(pathWithUID);

          const csv = await constructFirestoreCollectionCSV(snap, pathWithUID);

          promises.push(
            uploadCSVToStorage(
              csv,
              storagePrefix,
              pathWithUID,
              ".firestore.csv"
            ).then(() => {
              log.firestorePathExported(pathWithUID);
            })
          );
        }
      } else {
        const doc = await admin.firestore().doc(pathWithUID).get();
        const csv = await constructFirestoreDocumentCSV(doc, pathWithUID);
        promises.push(
          uploadCSVToStorage(
            csv,
            storagePrefix,
            pathWithUID,
            ".firestore.csv"
          ).then(() => {
            log.firestorePathExported(pathWithUID);
          })
        );
      }
    }
  }

  for (let path of exportPaths.databasePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      const snap = await admin.database().ref(pathWithUID).get();
      if (snap.exists()) {
        log.rtdbPathExporting(pathWithUID);
        const csv = await constructDatabaseCSV(snap, pathWithUID);
        promises.push(
          uploadCSVToStorage(
            csv,
            storagePrefix,
            pathWithUID,
            ".database.csv"
          ).then(() => {
            log.rtdbPathExported(pathWithUID);
          })
        );
      }
    }
  }

  return Promise.all(promises);
}

const uploadCSVToStorage = async (
  csv: string,
  storagePrefix: string,
  path: string,
  extension: string = ".csv"
) => {
  const formattedPath = path.replace(/\//g, "_");
  const storagePath = `${storagePrefix}/${formattedPath}${extension}`;

  const file = admin.storage().bucket(config.storageBucket).file(storagePath);

  try {
    await file.save(csv);
  } catch (e) {
    log.exportError(e, path);
  }

  return storagePath;
};
