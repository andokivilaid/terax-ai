import { emit, listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import {
  loadLaunchers,
  newLauncherId,
  saveLaunchers,
  type Launcher,
} from "../lib/launchers";

const CHANGED_EVENT = "terax://launchers-changed";

type State = {
  hydrated: boolean;
  launchers: Launcher[];
  hydrate: () => Promise<void>;
  upsert: (launcher: Launcher) => void;
  remove: (id: string) => void;
};

let initialized = false;

export const useLaunchersStore = create<State>((set, get) => ({
  hydrated: false,
  launchers: [],
  hydrate: async () => {
    if (initialized) return;
    initialized = true;
    set({ launchers: await loadLaunchers(), hydrated: true });
    void listen(CHANGED_EVENT, async () => {
      set({ launchers: await loadLaunchers() });
    });
  },
  upsert: (launcher) => {
    const list = get().launchers;
    const idx = list.findIndex((s) => s.id === launcher.id);
    const next =
      idx === -1
        ? [...list, launcher]
        : list.map((s) => (s.id === launcher.id ? launcher : s));
    set({ launchers: next });
    void saveLaunchers(next).then(() => emit(CHANGED_EVENT));
  },
  remove: (id) => {
    const next = get().launchers.filter((s) => s.id !== id);
    set({ launchers: next });
    void saveLaunchers(next).then(() => emit(CHANGED_EVENT));
  },
}));

export { newLauncherId };
