import {
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  Transaction,
} from "@google-cloud/firestore";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import config from "./config";
import { Constants } from "./constants";
import * as logs from "./logs";
import {
  DocumentPaths,
  filterObjectFields,
  isDeletionEventType,
  isValidDocumentId,
  isValidDocumentName,
  objectNameToFirestorePaths,
  pathHash,
  shouldMirrorObject,
  mirrorDocumentPathToTombstonePath,
} from "./util";

// Firestore Document Data for a Document that represents a GCS Object.
interface ItemDocument {
  lastEvent: Timestamp;
  // The Object's Metadata, some fields are converted to Timestamp or number types.
  gcsMetadata: any;
}
// Firestore Document Data for a Document that represents a GCS Object Prefix which may have further Items or
// Prefixes nested underneath in subcollections.
interface PrefixDocument {
  lastEvent: Timestamp;
  // This is used to figure out whether this Prefix needs to be checked for deletion when it's reference is deleted.
  // Stored as a MD5 Hash of the Child reference path to obscure names in the path to this Document.
  childRef: string;
}
// Firestore Document Data for the Document created when an Object gets deleted, this is stored in a separate
// subcollection and is used to store the latest Timestamp to compare against skip function execution in the case of
// out-of-order function execution.
interface Tombstone {
  lastEvent: Timestamp;
}
// Any Firestore Document created by this extension.
type MirrorDocument = ItemDocument | PrefixDocument | Tombstone;

/**
 * Get the metadata for an object, returning undefined if the object does not exist.
 * This is a wrapper around `getMetadata` that returns undefined if the error is a 404.
 *
 * @param objectName Path to the GCS object (without the bucket) to get metadata for.
 */
async function getCurrentMetadata(
  objectName: string
): Promise<ItemDocument | undefined> {
  try {
    const [gcsMetadata, _] = await admin
      .storage()
      .bucket(config.bucket!)
      .file(objectName)
      .getMetadata();
    return firestoreDocumentData(
      gcsMetadata as functions.storage.ObjectMetadata,
      "google.storage.object.finalize"
    ) as ItemDocument;
    // TODO: type error: https://www.typescriptlang.org/tsconfig#useUnknownInCatchVariables
  } catch (e: any) {
    if (e.code === 404) {
      return undefined;
    } else {
      logs.error(e, `getting metadata for ${objectName}`);
      throw e;
    }
  }
}

/**
 * Mirror the gcs state of the given object to Firestore.
 * This works by reading from GCS and Firestore and simulating an event.
 * @param objectName The name of the object (without the bucket).
 */
export async function mirrorObjectPath(objectName: string): Promise<void> {
  /**
   * Step 1: Skip this if the path isn't valid.
   * Step 2: Read the Firestore doc.
   * Step 3: Read the GCS Metadata (note this needs to be done after the Firestore read to handle delete timestamps correctly).
   * If they don't match, call onObjectChange.
   *  - If the GCS metadata doesn't exist, simulate a deletion event using the metadata from the Firestore document.
   *
   * Note that this function is meant to handle dropped events, not necessarily arbirary modifications.
   * It is also not going to be able to called on a prefix path.
   */
  if (!shouldMirrorObject(objectName)) {
    return logs.skippedObject(objectName);
  }
  const paths = objectNameToFirestorePaths(objectName);
  // Check if the generated Item Document is valid.
  if (!isValidDocumentName(paths.itemPath)) {
    return logs.invalidObjectName(objectName);
  }
  // Check if every generated Firestore Document will have a valid id.
  if (!objectName.split("/").every(isValidDocumentId)) {
    return logs.invalidObjectName(objectName);
  }
  const existingSnapshot = (await admin
    .firestore()
    .doc(paths.itemPath)
    .get()) as DocumentSnapshot<MirrorDocument>;
  const currentData = await getCurrentMetadata(objectName);
  if (currentData) {
    await updateFirestore(paths, currentData!, false);
  } else if (existingSnapshot.exists) {
    var lastEvent = new Timestamp(0, 0);
    if (existingSnapshot.data()!.hasOwnProperty(Constants.lastEventField)) {
      lastEvent = <Timestamp>existingSnapshot.data()![Constants.lastEventField];
    }
    await updateFirestore(paths, { lastEvent }, true);
  } else {
    logs.skippedMissingPath(objectName);
  }
}

/**
 * Handler for GCS Object Change events. Will validate the generated Documents before updating Firestore accordingly.
 * @param object The GCS Object Metadata object.
 * @param eventType The GCS Event type.
 */
export async function onObjectChange(
  object: functions.storage.ObjectMetadata,
  eventType: string
): Promise<void> {
  const isDeletion = isDeletionEventType(eventType);
  const objectName = object.name!;
  if (!shouldMirrorObject(objectName)) {
    return logs.skippedObject(objectName);
  }
  const paths = objectNameToFirestorePaths(objectName);
  // Check if the generated Item Document is valid.
  if (!isValidDocumentName(paths.itemPath)) {
    return logs.invalidObjectName(objectName);
  }
  // Check if every generated Firestore Document will have a valid id.
  if (!objectName.split("/").every(isValidDocumentId)) {
    return logs.invalidObjectName(objectName);
  }

  if (isDeletion) {
    // When an object is overwritten, it will fire a deletion/archive event for the original, followed by a finalize
    // event for the new one. We try to avoid updating firestore for the first event, so that firestore doesn't
    // temporarily show that the document doesn't exist.
    const [objectExists] = await admin
      .storage()
      .bucket(object.bucket)
      .file(objectName)
      .exists();
    if (objectExists) {
      return logs.skippedOverwrite(objectName, eventType);
    }
  }

  const data = firestoreDocumentData(object, eventType);
  await updateFirestore(paths, data, isDeletion);
}

/**
 * Update the Item Document in Firestore with the provided data and perform
 * maintenance (creation/deletion) on it's Prefix Documents if necessary.
 * @param paths The Item Document path and Prefix Document paths (sorted from root to the parent of the Item Document).
 * @param data The data to write to the Item Document (and Prefix Documents if it is a Tombstone).
 */
async function updateFirestore(
  paths: DocumentPaths,
  data: MirrorDocument,
  isDeletion: boolean
) {
  const prefixRefs = paths.prefixPaths.map((prefixPath) =>
    admin.firestore().doc(prefixPath)
  );
  const itemRef = admin.firestore().doc(paths.itemPath);
  const references = [...prefixRefs, itemRef];
  const timestamp = data[Constants.lastEventField];

  let attemptNumber = 0;
  return admin
    .firestore()
    .runTransaction(
      async (t: Transaction): Promise<void> => {
        attemptNumber += 1;
        logs.startingTransaction(itemRef.path, attemptNumber);
        // Can only write Documents after all reads have been done in the Transaction.
        const docsToWrite: {
          ref: DocumentReference;
          data: MirrorDocument;
        }[] = [];
        const docsToDelete: {
          ref: DocumentReference;
        }[] = [];
        const transactionReads: string[] = [];
        // Read the Item Document and it's Tombstone under the Transaction.
        const itemTombstoneRef = admin
          .firestore()
          .doc(mirrorDocumentPathToTombstonePath(itemRef.path));
        const [itemSnapshot, itemTombstoneSnapshot] = (await Promise.all([
          t.get(itemRef),
          t.get(itemTombstoneRef),
        ])) as [DocumentSnapshot<MirrorDocument>, DocumentSnapshot<Tombstone>];
        transactionReads.push(
          itemSnapshot.ref.path,
          itemTombstoneSnapshot.ref.path
        );
        if (
          isStaleEvent(itemSnapshot, data, isDeletion) ||
          isStaleEvent(itemTombstoneSnapshot, data, isDeletion)
        ) {
          // Skip if the event is older than what is in Firestore.
          return;
        }
        if (!isDeletion) {
          // Write the Item Document for create/update events
          docsToWrite.push({ ref: itemRef, data: data as ItemDocument });
          if (itemTombstoneSnapshot.exists) {
            docsToDelete.push({ ref: itemTombstoneSnapshot.ref });
          }
        } else {
          // Tombstone the Item Document for delete/archive events
          docsToWrite.push({
            ref: itemTombstoneSnapshot.ref,
            data: data as Tombstone,
          });
          if (itemSnapshot.exists) {
            docsToDelete.push({ ref: itemRef });
          }
        }
        // Move up the Prefixes from deepest to shallowest until the root.
        // Read each Document and queue up the Documents that we need to modify.
        for (let i = references.length - 2; i >= 0; i--) {
          const prefixRef = references[i];
          const prefixTombstoneRef = admin
            .firestore()
            .doc(mirrorDocumentPathToTombstonePath(prefixRef.path));
          // Read the Prefix Document and it's Tombstone under the Transaction.
          const [prefixSnapshot, prefixTombstoneSnapshot] = (await Promise.all([
            t.get(prefixRef),
            t.get(prefixTombstoneRef),
          ])) as [
            DocumentSnapshot<MirrorDocument>,
            DocumentSnapshot<Tombstone>
          ];
          transactionReads.push(
            prefixSnapshot.ref.path,
            prefixTombstoneSnapshot.ref.path
          );
          const child = references[i + 1];
          // Prefix Maintenance, create any Prefix Documents that need to exist, delete
          // any that no longer have a child underneath it.
          // A reference to an "existing" (non-Tombstone) child is kept on each Prefix
          // Document, this is used to skip a Firestore query to determine whether the
          // Prefix Document should be pruned when one of it's children is deleted or archived.
          if (!isDeletion) {
            // Prefix Maintenance for create/update events.
            if (prefixTombstoneSnapshot.exists) {
              docsToDelete.push({ ref: prefixTombstoneSnapshot.ref });
            }
            if (prefixSnapshot.exists) {
              // Because we create Prefix Documents from the deepest path to shallowest, once we find a Document
              // that has already been created we are guaranteed all remaining Prefix Documents also exist.
              break;
            }
            docsToWrite.push({
              ref: prefixRef,
              data: {
                [Constants.childRefField]: pathHash(child.path),
                [Constants.lastEventField]: timestamp,
              } as PrefixDocument,
            });
          } else {
            // Prefix Maintenance for delete/archive events.
            // The Prefix Document has been Tombstoned or never existed in the first place.
            if (!prefixSnapshot.exists) break;
            // Treat the Prefix Document as one requiring deletion if it is not what we're expecting/invalid.
            else if (!isValidPrefixDocument(prefixSnapshot)) {
              logs.invalidPrefixDocument(prefixSnapshot.id);
            }
            // If it already is a Tombstone we can stop.
            else if (prefixTombstoneSnapshot.exists) break;
            // This Document doesn't point to a child being deleted, can stop checking parents.
            else if (
              (<PrefixDocument>prefixSnapshot.data())[
                Constants.childRefField
              ] !== pathHash(child.path)
            ) {
              break;
            }
            // Reference points to Document being deleted, check if the Prefix Document should
            // still exist. If it should still exist, update it's child reference.
            const items = prefixRef.collection(config.itemsSubcollectionName);
            const prefixes = prefixRef.collection(
              config.prefixesSubcollectionName
            );
            const subcollections = [prefixes, items];
            const childDocs: QueryDocumentSnapshot<MirrorDocument>[] = [];
            // Try to find "existing" (non-Tombstone) child Documents to replace the child reference.
            // A Prefix Document is preferred for the new child reference because they are less likely to be deleted.
            for (let i = 0; i < subcollections.length; i++) {
              const subcollection = subcollections[i];
              const query = (await subcollection
                .limit(Constants.queryLimit - childDocs.length)
                .get()) as QuerySnapshot<MirrorDocument>;
              // New child reference cannot be the old one because its being deleted.
              const results = query.docs.filter(
                (doc) => doc.ref.path !== child.path
              );
              childDocs.push(...results);
            }
            if (childDocs.length === 0) {
              // No existing child Documents found. Add a tombstone and continue up.
              // Re-using the same Tombstone object that is used to replace Item Documents.
              docsToWrite.push({
                ref: prefixTombstoneSnapshot.ref,
                data: data as Tombstone,
              });
              if (prefixSnapshot.exists) {
                docsToDelete.push({ ref: prefixSnapshot.ref });
              }
              continue;
            }
            let newChildPath: string | null = null;
            // Find a child reference that hasn't been deleted since we ran the query and read under the transaction.
            // Gets are transactional whereas the Query performed earlier was not, prevents concurrent transactions
            // from deleting the document we've chosen as our new child reference before this transaction is done.
            for (let i = 0; i < childDocs.length; i++) {
              const newChild = childDocs[i];
              const childSnapshot = (await t.get(
                admin.firestore().doc(newChild.ref.path)
              )) as DocumentSnapshot<MirrorDocument>;
              transactionReads.push(childSnapshot.ref.path);
              if (childSnapshot.exists) {
                newChildPath = childSnapshot.ref.path;
                break;
              }
            }
            if (newChildPath === null) {
              throw "All Query results have since been Tombstoned. Retrying transaction...";
            } else {
              // Update reference to the new child prefix/object under it.
              docsToWrite.push({
                ref: prefixRef,
                data: {
                  [Constants.childRefField]: pathHash(newChildPath),
                  [Constants.lastEventField]: timestamp,
                } as PrefixDocument,
              });
              break;
            }
          }
        }
        logs.transactionReads(transactionReads);
        // Finished transaction reads. Attempt to write to each queued up document.
        logs.transactionWriteAttempt(
          docsToWrite.length,
          docsToWrite.map((d) => d.ref.path)
        );
        docsToWrite.forEach((doc) => {
          t.set(doc.ref, doc.data);
        });
        logs.transactionDeleteAttempt(
          docsToDelete.length,
          docsToDelete.map((d) => d.ref.path)
        );
        docsToDelete.forEach((doc) => {
          t.delete(doc.ref);
        });
      },
      {
        maxAttempts: Constants.transactionAttempts,
      }
    )
    .catch((reason: any) => {
      logs.transactionFailure(itemRef.path, reason);
      throw reason;
    });
}

/**
 * Returns whether an GCS event is stale based on what is currently in Firestore.
 * @param existingSnapshot Current Firestore snapshot.
 * @param eventData Data to write for the GCS event.
 */
export function isStaleEvent(
  existingSnapshot: DocumentSnapshot,
  eventData: MirrorDocument,
  isDeletion: boolean
) {
  // Timestamp on the incoming Firestore document.
  const newDocumentTime = eventData[Constants.lastEventField];
  if (existingSnapshot.exists) {
    // Treat the Document as non-existent if it doesn't have a last-event field.
    if (!existingSnapshot.data()!.hasOwnProperty(Constants.lastEventField)) {
      logs.missingLastEventField(existingSnapshot.id);
      return false;
    }
    const firestoreTime = <Timestamp>(
      existingSnapshot.data()![Constants.lastEventField]
    );
    if (firestoreTime.valueOf() > newDocumentTime.valueOf()) {
      logs.abortingStaleEvent(
        existingSnapshot.ref.path,
        newDocumentTime,
        firestoreTime
      );
      // This event is older than what is in Firestore.
      return true;
    } else if (firestoreTime.isEqual(newDocumentTime) && !isDeletion) {
      logs.staleTieBreak(
        existingSnapshot.ref.path,
        newDocumentTime,
        firestoreTime
      );
      // Break ties in favor of deletion event taking precedence.
      return true;
    }
    logs.eventNotStale(
      existingSnapshot.ref.path,
      newDocumentTime,
      firestoreTime
    );
    return false;
  }
  logs.docDoesNotExist(existingSnapshot.ref.path);
  return false;
}

/**
 * Construct the Firestore Document fields for the Prefixes Documents & Item Document.
 * @param metadata GCS metadata for the relevant object.
 * @param eventType The event type.
 */
function firestoreDocumentData(
  metadata: functions.storage.ObjectMetadata,
  eventType: string
): MirrorDocument {
  const timestamp = Timestamp.fromDate(new Date(metadata.updated));
  if (isDeletionEventType(eventType)) {
    // Instead of deleting Documents when the corresponding Object is deleted, replace it
    // with a "Tombstone" to deal with out-of-order function execution.
    return {
      [Constants.lastEventField]: timestamp,
    } as Tombstone;
  }
  const documentData: ItemDocument = {
    [Constants.lastEventField]: timestamp,
    [Constants.gcsMetadataField]: {},
  };
  const fields = filterObjectFields(metadata, config.metadataFieldFilter);
  fields.forEach(({ key, value }) => {
    let fieldValue: any;
    if (key === Constants.objectCustomMetadataField) {
      // Set custom metadata fields
      fieldValue = {} as { [x: string]: any };
      filterObjectFields(value, config.customMetadataFieldFilter).forEach(
        ({ key, value }) => {
          fieldValue[key] = value;
        }
      );
    } else if (Constants.numberFields.includes(key)) {
      fieldValue = parseInt(value);
    } else if (Constants.dateFields.includes(key)) {
      fieldValue = new Date(value);
    } else {
      fieldValue = value;
    }
    documentData[Constants.gcsMetadataField][key] = fieldValue;
  });
  return documentData;
}

/**
 * Returns whether a Prefix Document in Firestore has all the valid extension fields.
 * @param snapshot The Firestore snapshot.
 */
function isValidPrefixDocument(
  snapshot: DocumentSnapshot<MirrorDocument>
): snapshot is DocumentSnapshot<PrefixDocument> {
  const fields = [Constants.lastEventField, Constants.childRefField];
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (!snapshot.data()!.hasOwnProperty(field)) return false;
  }
  return true;
}
