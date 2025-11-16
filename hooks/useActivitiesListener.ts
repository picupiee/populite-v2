// hooks/useActivitiesListener.ts

import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export interface ActivityRecord {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  activityDate: Date; // Mapped from string for easy comparison
  createdByUid: string;
  createdAt: Date;
}

interface RealTimeActivityData {
  activities: ActivityRecord[];
  loading: boolean;
  error: Error | null;
}

// Simple mapper utility to convert Firestore data to our app model
const mapActivityDocToRecord = (data: any, id: string): ActivityRecord => ({
  id,
  title: data.title || "",
  shortDescription: data.shortDescription || "",
  longDescription: data.longDescription || "",
  // Convert ISO string back to Date object
  activityDate: data.activityDate ? new Date(data.activityDate) : new Date(),
  createdByUid: data.createdByUid || "",
  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
});

export const useActivitiesListener = (): RealTimeActivityData => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const collectionRef = collection(db, "activities");
    // Query: Order by activityDate ascending to show upcoming activities first
    const q = query(collectionRef, orderBy("activityDate", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedActivities: ActivityRecord[] = snapshot.docs.map((doc) =>
          mapActivityDocToRecord(doc.data(), doc.id)
        );

        setActivities(fetchedActivities);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Real-time Activity Listener Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { activities, loading, error };
};
