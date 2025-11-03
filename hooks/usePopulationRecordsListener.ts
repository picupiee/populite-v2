
import { PopulationRecord } from "@/constants/data";
import { collection, query, onSnapshot, getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import { mapDocToRecord } from "@/utils/firestoreMappers"; // Ensure this import path is correct
import { db } from "@/lib/firebase";

interface RealTimeData {
    records: PopulationRecord[];
    loading: boolean;
    error: Error | null;
}

export const usePopulationRecordsListener = (): RealTimeData => {
    const [records, setRecords] = useState<PopulationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const firestore = db; // Use your imported db instance
        const collectionRef = collection(firestore, "populationData");
        const q = query(collectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRecords: PopulationRecord[] = snapshot.docs.map(doc => 
                mapDocToRecord(doc.data(), doc.id)
            );
            setRecords(fetchedRecords);
            setError(null);
            setLoading(false);
        }, (err) => {
            console.error("Real-time Listener Error:", err);
            setError(err);
            setLoading(false);
        });

        // CRITICAL: Cleanup function
        return () => unsubscribe(); 
        
    }, []); // Runs ONCE on mount

    return { records, loading, error };
};