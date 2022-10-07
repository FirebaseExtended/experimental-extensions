import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyA7qjG8LNbBPeHi1gJemos-Ryf8ph4M2vk",
  authDomain: "export-user-data-extension.firebaseapp.com",
  databaseURL: "https://export-user-data-extension-default-rtdb.firebaseio.com",
  projectId: "export-user-data-extension",
  storageBucket: "export-user-data-extension.appspot.com",
  messagingSenderId: "75119052956",
  appId: "1:75119052956:web:6ac6840dd4331536914559",
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");
