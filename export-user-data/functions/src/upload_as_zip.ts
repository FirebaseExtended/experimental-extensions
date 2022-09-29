import archiver, { Archiver } from "archiver";
import { App } from "firebase-admin/app";
import { ExportPaths } from "./get_export_paths";
import config from "./config";
import * as log from "./logs";
import admin from "firebase-admin";
import {
  constructDatabaseCSV,
  constructFirestoreCollectionCSV,
  constructFirestoreDocumentCSV,
} from "./construct_exports";
import { replaceUID } from "./utils";

export async function uploadDataAsZip(
  exportPaths: ExportPaths,
  storagePrefix: string,
  uid: string
) {
  return new Promise<void>(async (resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    archive.on("error", reject);

    const storagePath = `${storagePrefix}.zip`;

    const stream = admin
      .storage()
      .bucket(config.storageBucket)
      .file(storagePath)
      .createWriteStream();

    archive.pipe(stream);

    await appendToArchive(archive, exportPaths, uid);

    await archive.finalize();
    resolve();
  });
}

async function appendToArchive(
  archive: Archiver,
  exportPaths: ExportPaths,
  uid: string
) {
  for (let path of exportPaths.firestorePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);

      log.firestorePathExporting(pathWithUID);

      if (pathWithUID.split("/").length % 2 === 1) {
        const snap = await admin.firestore().collection(pathWithUID).get();
        if (!snap.empty) {
          const csv = await constructFirestoreCollectionCSV(snap, path);
          const buffer = Buffer.from(csv);
          archive.append(buffer, { name: `${pathWithUID}.firestore.csv` });
        }
      } else {
        const snap = await admin.firestore().doc(pathWithUID).get();

        if (snap.exists) {
          const csv = await constructFirestoreDocumentCSV(snap, pathWithUID);
          const buffer = Buffer.from(csv);
          archive.append(buffer, { name: `${pathWithUID}.firestore.csv` });
        }
      }
    } else {
      log.firestorePathNotString();
    }
  }

  for (let path of exportPaths.databasePaths) {
    if (typeof path === "string") {
      const pathWithUID = replaceUID(path, uid);
      const snap = await admin.database().ref(pathWithUID).get();

      if (snap.exists()) {
        const csv = await constructDatabaseCSV(snap, pathWithUID);
        const buffer = Buffer.from(csv);
        archive.append(buffer, { name: `${pathWithUID}.database.csv` });
      }
    } else {
      log.rtdbPathNotString();
    }
  }
}
