import { create } from 'zustand';
import type { SessionData } from '../types';

interface DashboardState {
  filteredData: SessionData[];
  setFilteredData: (data: SessionData[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  filteredData: [],
  setFilteredData: (data) => set({ filteredData: data }),
}));