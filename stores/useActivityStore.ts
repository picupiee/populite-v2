import { create } from "zustand";

export interface ActivityRecord {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  activityDate: Date;
  createdByUid: string;
  createdAt: Date;
}

interface ActivityState {
  activities: ActivityRecord[];
  loading: boolean;
  error: Error | null;
  setActivities: (activities: ActivityRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  loading: false,
  error: null,

  // Activities
  setActivities: (activities) =>
    set({ activities, loading: false, error: null }),
  setLoading: (loading) => set({ loading, error: null }),
  setError: (error) => set({ error, loading: false }),
  reset: () => set({ activities: [], loading: false, error: null }),
}));
