import { PopulationRecord } from "@/constants/data";
import { create } from "zustand";

interface PopulationState {
  records: PopulationRecord[];
  loading: boolean;
  error: Error | null;
  setRecords: (records: PopulationRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

export const usePopulationStore = create<PopulationState>((set) => ({
  records: [],
  loading: true,
  error: null,
  setRecords: (records) => set({ records, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  reset: () => set({ records: [], loading: false, error: null }),
}));
