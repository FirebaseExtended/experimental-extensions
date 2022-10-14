import * as admin from "firebase-admin";
import { UserRecord } from "firebase-functions/v1/auth";
import setupEnvironment from "./setupEnvironment";
import fetch from "node-fetch";
import { File } from "@google-cloud/storage";
import unzip from "unzipper";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "demo-experimental",
    storageBucket: process.env.STORAGE_BUCKET,
    databaseURL: "http://localhost:9000/?ns=demo-experimental",
  });
}

setupEnvironment();
const firestore = admin.firestore();
const storage = admin.storage();
const database = admin.database();

export const generateRandomId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const createFirebaseUser = async (): Promise<UserRecord> => {
  const email = `${Math.random().toString(36).substring(2, 5)}@google.com`;
  return admin.auth().createUser({ email });
};

export const generateTopLevelUserCollection = async (db, userId) => {
  const collection = db.collection(userId);
  await collection.add({});
  return collection;
};

export const generateUserCollection = async (userId, data) => {
  const doc = await firestore.collection(`${userId}`).add(data);
  return doc.id;
};

export const generateDatabaseNode = async (data, userId: string) => {
  const node = database.ref(`${userId}`).push(data);
  return node;
};

export const generateUserDocument = async (
  collectionId: string,
  userId: string,
  data
) => {
  await firestore
    .collection(collectionId)
    .doc(`${userId}`)
    .set(data)
    .catch((err) => console.warn("Error appears here, ignoring for now"));
};

export const generateFileInUserStorage = async (userId, value) => {
  const file = storage.bucket().file(`test/${userId}.txt`);
  await file.save(value);
  return file;
};

export const resetFirebaseData = async (user?: UserRecord) => {
  await clearDatabase();
  await clearStorage();
  await clearFirestore();
  if (user) {
    await admin.auth().revokeRefreshTokens(user.uid);
  }
};

export const clearFirestore = async () => {
  await fetch(
    "http://localhost:8080/emulator/v1/projects/demo-experimental/databases/(default)/documents",
    { method: "DELETE" }
  );
};

export const clearStorage = async () => {
  const files = await storage.bucket().getFiles();
  for await (const file of files[0]) {
    await file.delete();
  }
};

export const clearDatabase = async () => {
  database.ref("/").set({});
};

type validateDocumentZippedExportOptions = {
  config: Record<string, any>;
  exportId: string;
  expectedUnzippedPath?: string;
  contentType: "csv" | "text";
  expectedData: string[][] | string;
};

export const validateZippedExport = async (
  file: File,
  {
    config,
    exportId,
    expectedUnzippedPath,
    contentType,
    expectedData,
  }: validateDocumentZippedExportOptions
) => {
  const fileName = file.name;
  const parts = fileName.split("/");
  // should be in the exports directory
  expect(parts[0]).toBe(config.cloudStorageExportDirectory);
  // should be in the export directory
  expect(parts[1]).toBe(exportId);
  // should have the user id as the name and have the .firestore.csv extension
  expect(parts[2]).toBe(`export.zip`);
  // should have the correct content
  const downloadResponse = await file.download();

  const zip = downloadResponse[0];

  // unzip the content
  const unzipped = await unzip.Open.buffer(zip);
  const unzippedFiles = unzipped.files;

  // validation for one zipped or unzipped csv built in:
  // // should have 1 file
  expect(unzippedFiles.length).toBe(1);
  const unzippedFile = unzippedFiles[0];
  if (expectedUnzippedPath) {
    expect(unzippedFile.path).toBe(expectedUnzippedPath);
  }

  // should have the correct content
  const content = (await unzippedFiles[0].buffer()).toString();
  if (contentType === "csv") {
    // parse the csv string into arrays
    const lines = content.split("\n");
    const csvData = lines.map((line) => line.split(","));
    // should have 2 lines with content and the last will be empty.
    validateCSVData(csvData, expectedData);
  }
  if (contentType === "text") {
    expect(content).toBe(expectedData);
  }
};

type validateDocumentCSVFileOptions = {
  config: Record<string, any>;
  exportId: string;
  expectedFileName: string;
  expectedCSVData: string[][];
};

export const validateCSVFile = async (
  file: File,
  {
    config,
    exportId,
    expectedFileName,
    expectedCSVData,
  }: validateDocumentCSVFileOptions
) => {
  const fileName = file.name;
  const parts = fileName.split("/");
  // should be in the exports directory
  expect(parts[0]).toBe(config.cloudStorageExportDirectory);
  // should be in the export directory
  expect(parts[1]).toBe(exportId);
  // should have the user id as the name and have the .firestore.csv extension
  expect(parts[2]).toBe(expectedFileName);
  // should have the correct content
  const downloadResponse = await file.download();

  const content = downloadResponse[0].toString();

  // parse the csv string into arrays
  const lines = content.split("\n");
  const csvData = lines.map((line) => line.split(","));

  validateCSVData(csvData, expectedCSVData);
};

const validateCSVHeaders = (headers) => {
  expect(headers[0]).toBe("TYPE");
  expect(headers[1]).toBe("path");
  expect(headers[2]).toBe("data");
};

const validateCSVData = (csvData: string[][], expected) => {
  const headers = csvData[0];
  validateCSVHeaders(headers);
  csvData.shift();

  expect(csvData.length) === expected.length;
  for (let i = 0; i < expected.length; i++) {
    expect(csvData[i]).toEqual(expected[i]);
  }
};

export const validatePendingRecord = (
  pendingRecordData: Record<string, any>,
  { user }: { user: UserRecord }
) => {
  expect(pendingRecordData.status).toBe("pending");
  expect(pendingRecordData.uid).toBe(user.uid);
  // // should be a server timestamp
  expect(pendingRecordData.startedAt).toHaveProperty("_nanoseconds");
  expect(pendingRecordData.startedAt).toHaveProperty("_seconds");
};

type validateCompleteRecordOptions = {
  user: UserRecord;
  config: Record<string, any>;
  exportId: string;
  shouldZip: boolean;
  fileNumber?: number;
};

export const validateCompleteRecord = (
  completeRecordData: Record<string, any>,
  {
    user,
    config,
    exportId,
    shouldZip,
    fileNumber,
  }: validateCompleteRecordOptions
) => {
  // // should be success
  expect(completeRecordData.status).toBe("complete");
  expect(completeRecordData.uid).toBe(user.uid);
  // // should be a server timestamp
  expect(completeRecordData.startedAt).toHaveProperty("_nanoseconds");
  expect(completeRecordData.startedAt).toHaveProperty("_seconds");

  // // should have a null zipPath
  if (shouldZip) {
    const zipPath = completeRecordData.zipPath;

    const zipPathParts = zipPath.split("/");

    // should have a record of the correct path to the zip in storage
    expect(zipPathParts[0]).toBe(config.cloudStorageExportDirectory);
    expect(zipPathParts[1]).toBe(exportId);
    expect(zipPathParts[2]).toBe("export.zip");
  } else {
    expect(completeRecordData.zipPath).toBeNull();
  }

  // // should have the right number of files exported
  expect(completeRecordData.exportedFileCount).toBe(fileNumber || 1);

  // // should have a string storage path
  expect(completeRecordData.storagePath).toBeDefined();
  expect(typeof completeRecordData.storagePath).toBe("string");

  const recordedStoragePath = completeRecordData.storagePath;
  const recordedStoragePathParts = recordedStoragePath.split("/");

  // // should have a record of the correct path to the export in storage
  expect(recordedStoragePathParts[0]).toBe(config.firestoreExportsCollection);
  expect(recordedStoragePathParts[1]).toBe(exportId);
};
