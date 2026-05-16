import { useEffect, useRef } from "react";
import { matchBinding } from "@/modules/shortcuts/shortcuts";
import { useLaunchersStore } from "../store/launchersStore";

/**
 * Match user-defined launcher key bindings on capture. Mirrors the structure
 * of `useGlobalShortcuts`, but bindings come from the launchers store rather
 * than the static SHORTCUTS array. The `onTrigger` callback ref is kept fresh
 * so the listener doesn't need to be re-attached every render.
 */
export function useLauncherShortcuts(onTrigger: (id: string) => void) {
  const launchers = useLaunchersStore((s) => s.launchers);
  const triggerRef = useRef(onTrigger);
  triggerRef.current = onTrigger;

  useEffect(() => {
    const items = launchers.filter((l) => !!l.shortcut);
    if (items.length === 0) return;

    const onKey = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs/editors. Same heuristic as the global
      // shortcut hook uses for the cases where it cares to skip.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      for (const l of items) {
        if (!l.shortcut) continue;
        if (e.repeat) continue;
        if (!matchBinding(e, l.shortcut)) continue;
        e.preventDefault();
        e.stopImmediatePropagation();
        triggerRef.current(l.id);
        return;
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [launchers]);
}
