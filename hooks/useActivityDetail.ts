import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityRecord } from "./useActivitiesListener";

interface ActivityDetailData {
  activity: ActivityRecord | null;
  loading: boolean;
  error: Error | null;
}

export const useActivityDetail = (activityId: string): ActivityDetailData => {
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activityId) {
      setLoading(false);
      return;
    }

    const fetchActivity = async () => {
      try {
        const docRef = doc(db, "activities", activityId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedActivity: ActivityRecord = {
            id: docSnap.id,
            title: data.title,
            shortDescription: data.shortDescription,
            longDescription: data.longDescription,
            activityDate: data.activityDate
              ? new Date(data.activityDate)
              : new Date(),
            createdByUid: data.createdByUid,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          };
          setActivity(fetchedActivity);
        } else {
          setError(new Error("Kegiatan Tidak Ditemukan !"));
        }
      } catch (err) {
        console.error("Error fetching activity detail: ", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [activityId]);

  return { activity, loading, error };
};
