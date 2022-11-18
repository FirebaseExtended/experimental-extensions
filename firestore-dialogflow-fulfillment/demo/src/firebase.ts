import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  orderBy,
  query,
} from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";

export const app = initializeApp({
  projectId: "extensions-testing",
  apiKey: "123",
});
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(firestore, "localhost", 8080);
connectFunctionsEmulator(functions, "localhost", 5001);

export function signIn() {
  return signInAnonymously(auth);
}

export async function newConversation(message: string): Promise<string> {
  const result = await httpsCallable<{ message: string }, string>(
    functions,
    "ext-firestore-dialogflow-fulfillment-newConversation"
  )({ message });
  return result.data;
}

export async function newMessage(
  conversationId: string,
  message: string
): Promise<void> {
  await httpsCallable<{ conversationId: string; message: string }, void>(
    functions,
    "ext-firestore-dialogflow-fulfillment-newMessage"
  )({ conversationId, message });
}

export function streamMessages(
  id: string,
  cb: (snapshot: QuerySnapshot<DocumentData>) => void
) {
  const ref = collection(firestore, "conversations", id, "messages");
  const q = query(ref, orderBy("created_at", "asc"));
  return onSnapshot(q, cb);
}
