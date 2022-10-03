import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type { QuerySnapshot } from "firebase-admin/firestore";
import type { Acknowledgement, Notice } from "./types";

const projectId = process.env.PROJECT_ID;
const noticesCollectionPath = process.env.NOTICES_COLLECTION || "notices";

if (getApps().length === 0) {
  if (!projectId) {
    throw new Error(
      "Missing PROJECT_ID environment variable. Please provide a .env file with the PROJECT_ID variable."
    );
  }

  initializeApp({
    projectId,
    credential: applicationDefault(),
  });
}

const firestore = getFirestore();

// Converts a Firestore document to a plain object.
function documentToObject<T>(
  document: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): T {
  return {
    ...document.data(),
    id: document.id,
  } as T;
}

// Converts a Firestore document to an array.
function snapshotToArray<T>(snapshot: QuerySnapshot): T[] {
  return snapshot.docs.map((doc) => documentToObject<T>(doc));
}

// Returns a list of notices.
export async function getNotices(): Promise<Notice[]> {
  const snapshot = await firestore.collection(noticesCollectionPath).get();
  return snapshotToArray(snapshot);
}

// Returns a notice, if it exists.
export async function getNotice(id: string): Promise<Notice | null> {
  const snapshot = await firestore
    .collection(noticesCollectionPath)
    .doc(id)
    .get();

  if (snapshot.exists) {
    return documentToObject<Notice>(snapshot);
  }

  return null;
}

// Returns a list of acknowledgements.
export async function getAcknowledgements(
  noticeId: string
): Promise<Acknowledgement[]> {
  const snapshot = await firestore
    .collection(noticesCollectionPath)
    .doc(noticeId)
    .collection("acknowledgements")
    .orderBy("createdAt", "desc")
    .get();

  return snapshotToArray<Acknowledgement>(snapshot);
}

// Creates a new notice, and returns the new ID.
export async function createNotice(data: any): Promise<string> {
  const ref = await firestore.collection(noticesCollectionPath).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// Updates a notice, by merging data.
export async function updateNotice(id: string, data: any): Promise<void> {
  await firestore
    .collection(noticesCollectionPath)
    .doc(id)
    .set(
      {
        ...data,
      },
      { merge: true }
    );
}
