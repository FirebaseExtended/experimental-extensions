import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { auth, firestore, functions, storage } from './firebase'
import { signInAnonymously } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { doc, onSnapshot } from 'firebase/firestore'
import { listAll, ref, getDownloadURL } from 'firebase/storage'

// Ensure the user is signed in before showing the app.
signInAnonymously(auth).then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})

function App() {
  const [exporting, setExporting] = useState(false);
  const [files, setFiles] = useState<string[]>();

  // Kicks off a new export task.
  async function onExport() {
    setExporting(true);

    // Trigger the export.
    const result = await httpsCallable<void, { exportId: string }>(functions, 'todo-export-function-name')();

    // Get the returned export id.
    const exportId = result.data.exportId;

    // Make a Firestore reference to the export.
    const documentRef = doc(firestore, 'exports', exportId);

    // Listen for changes to the export - when complete returned the storage path of the export items.
    const storagePath = await new Promise<string>((resolve, reject) => {
      const unsubscribe = onSnapshot(documentRef, snapshot => {
        if (!snapshot.exists) {
          unsubscribe();
          return reject(new Error("Export document not found"));
        }

        const data = snapshot.data()!;

        if (data.status === 'complete') {
          unsubscribe();
          return resolve(data.storagePath);
        }
      });
    });

    // Get a list of all the files in the export.
    const listResult = await listAll(ref(storage, storagePath));

    // Store the paths to each exported file.
    setFiles(listResult.items.map(item => item.fullPath));

    // We're done exporting.
    setExporting(false);
  }

  async function onDownload(path: string) {
    // Download the file.
    const url = await getDownloadURL(ref(storage, path));

    // Open the file in a new tab.
    window.open(url);
  }

  if (!exporting) {
    return <button onClick={onExport}>Start Export</button>;
  }

  if (exporting && !files) {
    return <p>Exporting...</p>;
  }

  return (
    <div>
      {files!.map((file) => (
        <div>
          <span>{file}</span>
          <span> - </span>
          <button onClick={() => onDownload(file)}>Download File</button>
        </div>
      ))}
    </div>
  );
}
