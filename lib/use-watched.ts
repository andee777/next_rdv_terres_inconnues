import { useCallback, useSyncExternalStore } from "react";

// Watched episodes live in localStorage and are exposed through
// useSyncExternalStore: the server snapshot is always empty (so hydration
// matches), and every component using the hook stays in sync, including
// across browser tabs through the `storage` event.

const STORAGE_KEY = "rdv-terres-inconnues:watched";
const EMPTY: ReadonlySet<number> = new Set();

let snapshot: ReadonlySet<number> | null = null;
const listeners = new Set<() => void>();

export function parseWatched(raw: string | null): ReadonlySet<number> {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return new Set(
      parsed.filter((value): value is number => Number.isInteger(value)),
    );
  } catch {
    return EMPTY;
  }
}

export function serializeWatched(watched: ReadonlySet<number>): string {
  return JSON.stringify([...watched].sort((a, b) => a - b));
}

function read(): ReadonlySet<number> {
  try {
    return parseWatched(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY; // storage blocked (private mode, disabled cookies)
  }
}

function getSnapshot(): ReadonlySet<number> {
  snapshot ??= read();
  return snapshot;
}

function write(next: ReadonlySet<number>) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeWatched(next));
  } catch {
    // Keep the in-memory state even if persisting fails.
  }
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  snapshot = read();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function useWatched() {
  const watched = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const toggle = useCallback((episode: number) => {
    const next = new Set(getSnapshot());
    if (!next.delete(episode)) next.add(episode);
    write(next);
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  return { watched, toggle, clear };
}
