Below we give an overview of the specifications for the Export User Data extension, including TypeScript definitions & detailed descriptions.

### ExportUserDataResponse Interface

The response returned from a call to the `exportUserData` callable.

```typescript
// A string representing the unique Export ID
type ExportUserDataResponse = { exportId: string };
```

### ExportDocument Interface

The specification for a single document within the configured collection.

```typescript
type ExportDocument = {
  // A user’s UID which triggered the export.
  uid: string;
  // The timestamp of when the export was triggered.
  startedAt: Timestamp;
  // The export status.
  status: ‘pending’ | ‘complete’;
  // When status is ‘complete’, the storage path to where the file have been exported.
  storagePath?: string;
  //  When status is ‘complete’ and zip archiving is enabled, the path to the archived zip file containing all exported files.
  zipPath?: string;
  // When status is ‘complete’, the total exported file count.
  exportedFileCount?: number;
}
```
