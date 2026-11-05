import { doc, setDoc, deleteDoc } from "firebase/firestore";
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
    await setDoc(docRef, sanitizedData);
    console.log(`Cloud Sync Success [${collectionName}/${cleanId}]`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${cleanId}`);
  }
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
