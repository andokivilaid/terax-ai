import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import {
  useLaunchersStore,
  newLauncherId,
  type Launcher,
  type LauncherKind,
} from "@/modules/launchers";
import {
  getBindingTokens,
  type KeyBinding,
} from "@/modules/shortcuts/shortcuts";
import {
  Add01Icon,
  ComputerTerminal02Icon,
  Delete02Icon,
  Edit02Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";

export function LaunchersSection() {
  const launchers = useLaunchersStore((s) => s.launchers);
  const upsert = useLaunchersStore((s) => s.upsert);
  const remove = useLaunchersStore((s) => s.remove);
  const hydrate = useLaunchersStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const [editing, setEditing] = useState<Launcher | null>(null);

  const terminals = launchers.filter((l) => l.kind === "terminal");
  const previews = launchers.filter((l) => l.kind === "preview");

  const startNew = (kind: LauncherKind) => {
    setEditing({
      id: newLauncherId(),
      kind,
      name: "",
      value: "",
    });
  };

  return (
    <div className="flex flex-col gap-7">
      <SectionHeader
        title="Launchers"
        description="Custom entries in the + menu. Each terminal launcher opens a shell and runs your command; each preview launcher opens a URL."
      />

      <LauncherList
        kind="terminal"
        items={terminals}
        onNew={() => startNew("terminal")}
        onEdit={setEditing}
        onDelete={(id) => remove(id)}
      />

      <LauncherList
        kind="preview"
        items={previews}
        onNew={() => startNew("preview")}
        onEdit={setEditing}
        onDelete={(id) => remove(id)}
      />

      <LauncherEditorDialog
        launcher={editing}
        existing={launchers}
        onClose={() => setEditing(null)}
        onSave={(l) => {
          upsert(l);
          setEditing(null);
        }}
      />
    </div>
  );
}

function LauncherList({
  kind,
  items,
  onNew,
  onEdit,
  onDelete,
}: {
  kind: LauncherKind;
  items: Launcher[];
  onNew: () => void;
  onEdit: (l: Launcher) => void;
  onDelete: (id: string) => void;
}) {
  const isTerminal = kind === "terminal";
  const title = isTerminal ? "Terminal launchers" : "Preview launchers";
  const description = isTerminal
    ? 'e.g. "Claude Code" running `claude --chrome`'
    : 'e.g. "Docs" pointing at https://your-docs.example.com';
  const addLabel = isTerminal ? "New terminal" : "New preview";

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <Label>{title}</Label>
          <span className="text-[10.5px] text-muted-foreground">
            {description}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 px-2 text-[11px]"
          onClick={onNew}
        >
          <HugeiconsIcon icon={Add01Icon} size={12} strokeWidth={1.75} />
          {addLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/30 px-4 py-6 text-center text-[11px] text-muted-foreground">
          {isTerminal
            ? "No terminal launchers yet."
            : "No preview launchers yet."}
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2"
            >
              <HugeiconsIcon
                icon={isTerminal ? ComputerTerminal02Icon : Globe02Icon}
                size={14}
                strokeWidth={1.75}
                className="shrink-0 text-muted-foreground"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[12px] font-medium">
                  {l.name || (isTerminal ? "(unnamed terminal)" : "(unnamed preview)")}
                </span>
                <span className="truncate font-mono text-[10.5px] text-muted-foreground">
                  {l.value || (isTerminal ? "(no command)" : "(no URL)")}
                </span>
              </div>
              {l.shortcut ? (
                <KbdGroup className="mr-1">
                  {getBindingTokens(l.shortcut).map((t, i) => (
                    <Kbd key={i}>{t}</Kbd>
                  ))}
                </KbdGroup>
              ) : null}
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => onEdit(l)}
                title="Edit"
              >
                <HugeiconsIcon
                  icon={Edit02Icon}
                  size={12}
                  strokeWidth={1.75}
                />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(l.id)}
                title="Delete"
              >
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={12}
                  strokeWidth={1.75}
                />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LauncherEditorDialog({
  launcher,
  existing,
  onClose,
  onSave,
}: {
  launcher: Launcher | null;
  existing: Launcher[];
  onClose: () => void;
  onSave: (l: Launcher) => void;
}) {
  const [draft, setDraft] = useState<Launcher | null>(launcher);
  const [recording, setRecording] = useState(false);
  useEffect(() => {
    setDraft(launcher);
    setRecording(false);
  }, [launcher]);

  if (!draft) return null;

  const isTerminal = draft.kind === "terminal";
  const isNew = !existing.some((l) => l.id === draft.id);
  const canSave =
    draft.name.trim().length > 0 && draft.value.trim().length > 0;

  return (
    <Dialog open={!!launcher} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[14px]">
            {isNew
              ? isTerminal
                ? "New terminal launcher"
                : "New preview launcher"
              : isTerminal
                ? "Edit terminal launcher"
                : "Edit preview launcher"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={isTerminal ? "Claude Code" : "Docs"}
              className="h-8 text-[12px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{isTerminal ? "Command" : "URL"}</Label>
            <Input
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
              placeholder={
                isTerminal ? "claude --chrome" : "https://example.com"
              }
              className="h-8 font-mono text-[11.5px]"
            />
            {isTerminal ? (
              <span className="text-[10px] text-muted-foreground">
                Typed into a new shell and run with Enter.
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Shortcut</Label>
            {recording ? (
              <Recorder
                onRecord={(b) => {
                  setDraft({ ...draft, shortcut: b });
                  setRecording(false);
                }}
                onCancel={() => setRecording(false)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRecording(true)}
                  className="flex min-h-[28px] flex-1 cursor-pointer items-center rounded-md border border-border/60 bg-card/60 px-2 hover:bg-accent/40"
                >
                  {draft.shortcut ? (
                    <KbdGroup>
                      {getBindingTokens(draft.shortcut).map((t, i) => (
                        <Kbd key={i}>{t}</Kbd>
                      ))}
                    </KbdGroup>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">
                      Click to record
                    </span>
                  )}
                </button>
                {draft.shortcut ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setDraft({ ...draft, shortcut: undefined })}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canSave} onClick={() => onSave(draft)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Recorder({
  onRecord,
  onCancel,
}: {
  onRecord: (b: KeyBinding) => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      const isMod = ["Control", "Shift", "Alt", "Meta"].includes(e.key);
      if (isMod) return;
      const hasPrimaryModifier = e.ctrlKey || e.altKey || e.metaKey;
      const isCharacterKey = e.key.length === 1;
      if (!hasPrimaryModifier && (!e.shiftKey || isCharacterKey)) return;
      onRecord({
        key: e.key,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      });
    };
    window.addEventListener("keydown", onDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onDown, { capture: true });
  }, [onRecord, onCancel]);

  return (
    <div className="flex items-center gap-2 rounded-md bg-accent/50 px-2 py-1.5 text-[11px] ring-1 ring-accent">
      <span className="animate-pulse font-medium">Recording…</span>
      <span className="text-muted-foreground">(Esc to cancel)</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn("text-[11px] font-medium tracking-tight text-muted-foreground")}>
      {children}
    </span>
  );
}
