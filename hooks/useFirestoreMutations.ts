// /hooks/useFirestoreMutations.ts (For Create, Update, Delete)

import { PopulationRecord } from "@/constants/data";
import { db } from "@/lib/firebase"; // Ensure this path is correct
import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  Timestamp,
  updateDoc,
  WithFieldValue,
} from "firebase/firestore";
import { useMemo } from "react";

const COLLECTION_NAME = "populationData";

// Helper for converting Date to Timestamp for saving
const dateToTimestamp = (date?: Date | null) => 
    date ? Timestamp.fromDate(date) : null;

/**
 * Custom hook for all CUD (Create, Update, Delete) operations.
 */
export const usePopulationMutations = () => {
    
    // We stabilize the functions using useMemo
    return useMemo(() => {

        // --- CREATE ---
        const addRecord = async (
            recordData: Omit<PopulationRecord, "id" | "entryDate">
        ): Promise<string> => {
            try {
                const collectionRef = collection(db, COLLECTION_NAME);
                const dataToSave: WithFieldValue<DocumentData> = {
                    ...recordData,
                    entryDate: Timestamp.now(),
                    dateOccupied: dateToTimestamp(recordData.dateOccupied),
                };
                const docRef = await addDoc(collectionRef, dataToSave);
                return docRef.id;
            } catch (error) {
                console.error("Error adding document: ", error);
                throw new Error("Gagal menambah data warga!");
            }
        };

        // --- UPDATE ---
        const updateRecord = async (
            id: string,
            updates: Partial<Omit<PopulationRecord, "id" | "entryData">>
        ) => {
            try {
                const docRef = doc(db, COLLECTION_NAME, id);
                const updateToSave: Partial<DocumentData> = {};

                // Map updates to Firestore-compatible format (Dates to Timestamps)
                for (const keyString in updates) {
                    const key = keyString as keyof typeof updates;
                    const value = updates[key];

                    if (key === "dateOccupied") {
                        updateToSave.dateOccupied = dateToTimestamp(value as Date | null | undefined);
                    } else if (value !== undefined) {
                        updateToSave[key] = value;
                    }
                }

                await updateDoc(docRef, updateToSave);
            } catch (error) {
                console.error("Error updating document: ", error);
                throw new Error("Gagal mengupdate data warga!");
            }
        };

        // --- DELETE ---
        const deleteRecord = async (id: string) => {
            try {
                const docRef = doc(db, COLLECTION_NAME, id);
                await deleteDoc(docRef);
            } catch (error) {
                console.error("Error deleting document: ", error);
                throw new Error("Gagal menghapus data!");
            }
        };

        return { addRecord, updateRecord, deleteRecord };
    }, []);
};