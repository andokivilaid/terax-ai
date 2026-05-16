import { LazyStore } from "@tauri-apps/plugin-store";
import type { KeyBinding } from "@/modules/shortcuts/shortcuts";

export type LauncherKind = "terminal" | "preview";

export type Launcher = {
  id: string;
  kind: LauncherKind;
  name: string;
  /** Command (terminal kind) or URL (preview kind). */
  value: string;
  /** Optional user-defined keyboard binding. */
  shortcut?: KeyBinding;
};

const STORE_PATH = "terax-launchers.json";
const KEY_LIST = "launchers";

const store = new LazyStore(STORE_PATH, { defaults: {}, autoSave: 200 });

export async function loadLaunchers(): Promise<Launcher[]> {
  return (await store.get<Launcher[]>(KEY_LIST)) ?? [];
}

export async function saveLaunchers(list: Launcher[]): Promise<void> {
  await store.set(KEY_LIST, list);
  await store.save();
}

export function newLauncherId(): string {
  return `ln-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
