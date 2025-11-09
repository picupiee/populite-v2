import { PopulationRecord } from "@/constants/data";
import { db } from "@/lib/firebase";
import { mapDocToRecord } from "@/utils/firestoreMappers"; // Ensure this import path is correct
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAccess } from "./useAccess";

interface RealTimeData {
  records: PopulationRecord[];
  loading: boolean;
  error: Error | null;
}

export const usePopulationRecordsListener = (): RealTimeData => {
  const { can, PERMISSIONS } = useAccess();

  const [records, setRecords] = useState<PopulationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const firestore = db; // Use your imported db instance
    const collectionRef = collection(firestore, "populationData");
    const q = query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const canViewSenstivieName = can(PERMISSIONS.VIEW_SENSITIVE_NAME);
        const fetchedRecords: PopulationRecord[] = snapshot.docs.map(
          (doc) => {
            let record = mapDocToRecord(doc.data(), doc.id);

            if (!canViewSenstivieName) {
              const maskedName = record.name.charAt(-1) + "********";
              record = {
                ...record,
                name: maskedName,
              };
            }
            return record;
          }
          // mapDocToRecord(doc.data(), doc.id)
        );
        setRecords(fetchedRecords);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Real-time Listener Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    // CRITICAL: Cleanup function
    return () => unsubscribe();
  }, [can, PERMISSIONS.VIEW_SENSITIVE_NAME]); // Runs ONCE on mount

  return { records, loading, error };
};
