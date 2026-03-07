import { db } from "@/lib/firebase";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityRecord } from "./useActivitiesListener";

interface ActivityDetailData {
  activity: ActivityRecord | null;
  loading: boolean;
  error: Error | null;
}

const mapActivityData = (id: string, data: DocumentData): ActivityRecord => ({
  id: id,
  title: data.title,
  shortDescription: data.shortDescription,
  longDescription: data.longDescription,
  activityDate: data.activityDate ? new Date(data.activityDate) : new Date(),
  createdByUid: data.createdByUid,
  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
});

export const useActivityDetail = (activityId: string): ActivityDetailData => {
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activityId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "activities", activityId);

    // 🔑 SWITCH to Real-Time Listener (onSnapshot)
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const fetchedActivity = mapActivityData(docSnap.id, docSnap.data());
          setActivity(fetchedActivity);
          setError(null);
        } else {
          setActivity(null);
          setError(new Error("Kegiatan tidak ditemukan."));
        }
        setLoading(false);
      },
      // Handle error during initial fetch or subsequent listener errors
      (err) => {
        console.error("Error setting up activity listener:", err);
        setError(err);
        setLoading(false);
      }
    );

    // 🔑 Cleanup function: Stop listening when the component unmounts
    return () => unsubscribe();
  }, [activityId]);

  return { activity, loading, error };
};
