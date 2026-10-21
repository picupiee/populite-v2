import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { usePopulationStore } from "@/stores/usePopulationStore";
import { mapDocToRecord } from "@/utils/firestoreMappers"; // Ensure this import path is correct
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect } from "react";
import { useAccess } from "./useAccess";
export const usePopulationRecordsListener = () => {
  const { user } = useAuth();
  const { can, PERMISSIONS } = useAccess();
  const { records, loading, error, setRecords, setLoading, setError, reset } =
    usePopulationStore();

  useEffect(() => {
    if (!user) {
      reset();
      return;
    }

    setLoading(true);
    const firestore = db;
    const collectionRef = collection(firestore, "populationData");
    const q = query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const canViewSenstivieName = can(PERMISSIONS.VIEW_SENSITIVE_NAME);
        const fetchedRecords = snapshot.docs.map((doc) => {
          let record = mapDocToRecord(doc.data(), doc.id);

          if (!canViewSenstivieName) {
            const maskedName = record.name.charAt(-1) + "********";
            record = {
              ...record,
              name: maskedName,
            };
          }
          return record;
        });

        setRecords(fetchedRecords);
      },
      (err) => {
        console.error("Real-time Listener Error:", err);
        setError(err);
      },
    );

    return () => unsubscribe();
  }, [user, can, PERMISSIONS.VIEW_SENSITIVE_NAME]);

  return { records, loading, error };
};
