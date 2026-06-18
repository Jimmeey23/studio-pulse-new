import create from 'zustand';
import type { SessionData } from './types';

type State = {
  sessions: SessionData[];
  setSessions: (s: SessionData[]) => void;
  addSession: (s: SessionData) => void;
  clear: () => void;
};

export const useClassStore = create<State>((set) => ({
  sessions: [],
  setSessions: (s) => set({ sessions: s }),
  addSession: (s) => set((state) => ({ sessions: [...state.sessions, s] })),
  clear: () => set({ sessions: [] }),
}));
