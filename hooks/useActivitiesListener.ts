// hooks/useActivitiesListener.ts

import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { ActivityRecord, useActivityStore } from "@/stores/useActivityStore";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect } from "react";

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

export const useActivitiesListener = () => {
  const { user } = useAuth();
  const {
    activities,
    loading,
    error,
    setActivities,
    setLoading,
    setError,
    reset,
  } = useActivityStore();
  useEffect(() => {
    if (!user) {
      reset(); // Clears Zustand store immediately on logout!
      return;
    }
    setLoading(true);
    const collectionRef = collection(db, "activities");
    const q = query(collectionRef, orderBy("activityDate", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) =>
          mapActivityDocToRecord(doc.data(), doc.id),
        );
        setActivities(fetched);
      },
      (err) => {
        console.error("Listener error:", err);
        setError(err);
      },
    );
    return () => unsubscribe();
  }, [user]);
  return { activities, loading, error };
};
