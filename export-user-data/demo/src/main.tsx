import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { auth, firestore, functions, storage } from './firebase'
import { signInAnonymously } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { doc, onSnapshot } from 'firebase/firestore'
import { listAll, ref, getDownloadURL, getBlob } from 'firebase/storage'

import styles from './styles.module.css'

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
  async function onExport({ zip }: { zip: boolean }) {
    setExporting(true);

    // Trigger the export.
    const result = await httpsCallable<void, { exportId: string }>(functions, `ext-export-user-data-${zip ? '' : 'rapy-'}exportUserData`)();
    // Get the returned export id.
    const exportId = result.data.exportId;

    // Make a Firestore reference to the export.
    const documentRef = doc(firestore, 'exports', exportId);

    // Listen for changes to the export - when complete returned the storage path of the export items.
    const { storagePath, zipPath } = await new Promise<{
      storagePath: string;
      zipPath?: string;
    }>((resolve, reject) => {
      const unsubscribe = onSnapshot(documentRef, (snapshot) => {
        if (!snapshot.exists) {
          unsubscribe();
          return reject(new Error("Export document not found"));
        }

        const data = snapshot.data()!;

        if (data.status === "complete") {
          unsubscribe();
          return resolve({
            storagePath: data.storagePath,
            zipPath: data.zipPath,
          });
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

  if (!exporting && !files) {
    return (
      <Container>
        <div className={styles.buttonContainer}>
          <button type={'button'} className={styles.btn} onClick={() => onExport({ zip: true })}>Start Export (zip enabled)</button>
          <button type={'button'} className={styles.btn} onClick={() => onExport({ zip: false })}>Start Export (zip disabled)</button>
        </div>
      </Container>
    );
  }

  if (exporting && !files) {
    return (
      <Container>
        <p>Exporting...</p>
      </Container>
    );
  }

  return (
    <Container>
      <ol>
        {files!.map((file) => (
          <li key={file}>
            <span>{file}</span>
            <span>&nbsp; &nbsp;</span>
            <button onClick={() => onDownload(file)}>Download File</button>
          </li>
        ))}
      </ol>
    </Container>
  );
}

function Container(props: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <h1>Export User Data Demo</h1>
      <p>
        Click the export button below to trigger an export of some none user
        specific data. Once complete, you can download the exported items.
      </p>
      <div>{props.children}</div>
    </div>
  );
}