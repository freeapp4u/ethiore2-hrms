import { doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";

/**
 * Synchronizes a single document record to its corresponding Firestore collection.
 * 
 * @param collectionName The name of the Firestore collection
 * @param id The document ID (key)
 * @param data The data object to store
 */
export async function syncRecordToFirestore(collectionName: string, id: string, data: any): Promise<void> {
  if (!auth.currentUser) {
    // Only attempt Firestore cloud write when an authenticated session exists
    console.warn(`[Firestore Sync] Skipped write to ${collectionName}/${id}: No authenticated session.`);
    return;
  }
  const cleanId = id.replace(/[^a-zA-Z0-9_\-]/g, "_"); // Ensure valid id format matching pattern
  try {
    const docRef = doc(db, collectionName, cleanId);
    // Sanitize optional properties or undefined to be null for firestore compatibility
    const sanitizedData = JSON.parse(JSON.stringify(data, (_, v) => v === undefined ? null : v));
    if (auth.currentUser?.uid && !sanitizedData.ownerUid) {
      sanitizedData.ownerUid = auth.currentUser.uid;
    }
    if (auth.currentUser?.email && !sanitizedData.employeeEmail) {
      sanitizedData.employeeEmail = auth.currentUser.email.trim().toLowerCase();
    }
    await setDoc(docRef, sanitizedData);
    console.log(`Cloud Sync Success [${collectionName}/${cleanId}]`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${cleanId}`);
  }
}

/**
 * Synchronizes a batch of document records to a Firestore collection using writeBatch,
 * respecting Firestore's 500-write limit per batch operation. Each document receives
 * a separate unique document reference in Firestore.
 */
export async function syncBatchRecordsToFirestore(
  collectionName: string,
  records: { id: string; data: any }[]
): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
  if (records.length === 0) {
    return { successCount: 0, failedCount: 0, errors: [] };
  }

  if (!auth.currentUser) {
    console.warn(`[Firestore Sync] Skipped batch write to ${collectionName}: No authenticated session.`);
    return { successCount: records.length, failedCount: 0, errors: [] };
  }

  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // Firestore writeBatch has a limit of 500 operations per batch
  const BATCH_SIZE = 450;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    try {
      const batch = writeBatch(db);
      chunk.forEach(rec => {
        const cleanId = rec.id.replace(/[^a-zA-Z0-9_\-]/g, "_");
        const docRef = doc(db, collectionName, cleanId);
        const sanitizedData = JSON.parse(JSON.stringify(rec.data, (_, v) => v === undefined ? null : v));
        if (auth.currentUser?.uid && !sanitizedData.ownerUid) {
          sanitizedData.ownerUid = auth.currentUser.uid;
        }
        if (auth.currentUser?.email && !sanitizedData.employeeEmail) {
          sanitizedData.employeeEmail = auth.currentUser.email.trim().toLowerCase();
        }
        batch.set(docRef, sanitizedData);
      });
      await batch.commit();
      successCount += chunk.length;
      console.log(`[Cloud Batch Sync Success] ${collectionName}: ${chunk.length} documents committed.`);
    } catch (batchErr: any) {
      console.warn(`[Cloud Batch Sync Warning] Batch commit failed for ${collectionName}, falling back to individual writes:`, batchErr);
      for (const rec of chunk) {
        try {
          const cleanId = rec.id.replace(/[^a-zA-Z0-9_\-]/g, "_");
          const docRef = doc(db, collectionName, cleanId);
          const sanitizedData = JSON.parse(JSON.stringify(rec.data, (_, v) => v === undefined ? null : v));
          await setDoc(docRef, sanitizedData);
          successCount++;
        } catch (indErr: any) {
          failedCount++;
          const msg = `Record ${rec.id}: ${indErr?.message || String(indErr)}`;
          errors.push(msg);
          handleFirestoreError(indErr, OperationType.WRITE, `${collectionName}/${rec.id}`);
        }
      }
    }
  }

  return { successCount, failedCount, errors };
}

/**
 * Deletes a document from the corresponding Firestore collection.
 */
export async function deleteRecordFromFirestore(collectionName: string, id: string): Promise<void> {
  if (!auth.currentUser) {
    console.warn(`[Firestore Sync] Skipped delete on ${collectionName}/${id}: No authenticated session.`);
    return;
  }
  const cleanId = id.replace(/[^a-zA-Z0-9_\-]/g, "_");
  try {
    const docRef = doc(db, collectionName, cleanId);
    await deleteDoc(docRef);
    console.log(`Cloud Delete Success [${collectionName}/${cleanId}]`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${cleanId}`);
  }
}

/**
 * Synchronizes a whole list of records to Firestore (e.g. on full database initialization/sync click)
 */
export async function syncCollectionToFirestore(collectionName: string, records: any[], idKey: string): Promise<void> {
  if (!auth.currentUser) {
    console.warn(`[Firestore Sync] Skipped collection sync for ${collectionName}: No authenticated session.`);
    return;
  }
  for (const record of records) {
    const id = record[idKey];
    if (id) {
      await syncRecordToFirestore(collectionName, String(id), record);
    }
  }
}
