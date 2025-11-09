// /hooks/usePopulationRecordListener.ts (Stable Read Hook)

import { PopulationRecord } from "@/constants/data";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
// Ensure mapDocToRecord and db imports are correct for your structure
import { db } from "@/lib/firebase";
import { mapDocToRecord } from "@/utils/firestoreMappers";
import { useAccess } from "./useAccess";

// Define the interface for clarity and type safety
interface SingleRecordData {
  record: PopulationRecord | null;
  loading: boolean;
  error: Error | null;
}

// Helper to get Firestore instance if needed (replace if you use 'db' directly)
const firestore = db; // Assuming db is the Firestore instance

export const usePopulationRecordListener = (
  id: string | null
): SingleRecordData => {
  const { can, PERMISSIONS } = useAccess();
  const [record, setRecord] = useState<PopulationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 1. Handle no ID case immediately
    if (!id) {
      setLoading(false);
      setRecord(null);
      return;
    }

    const docRef = doc(firestore, "populationData", id);
    setLoading(true); // Reset loading state when id changes

    // 2. Setup the GUARANTEED stable listener
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = mapDocToRecord(docSnap.data(), docSnap.id);
          let processedRecord = { ...data };
          if (!can(PERMISSIONS.VIEW_SENSITIVE_NAME)) {
            const maskedName = processedRecord.name.charAt(-1) + "***********";
            processedRecord.name = maskedName;
          }
          setRecord(processedRecord);
          setError(null);
        } else {
          setRecord(null);
          setError(new Error("Record not found"));
        }
        setLoading(false);
      },
      (err) => {
        console.error("Single Doc Listener Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    // 3. Return the CRITICAL cleanup function
    return () => unsubscribe();
  }, [id, can]); // Effect re-runs only when the document ID changes

  return { record, loading, error };
};
