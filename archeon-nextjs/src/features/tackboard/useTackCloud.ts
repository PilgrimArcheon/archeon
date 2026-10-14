"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialData, readStore, STORE_KEY, type TackboardData } from "./model";

export type SyncStatus = "loading" | "guest" | "synced" | "saving" | "offline" | "conflict";
type Conflict = { data: TackboardData | null; revision: number };
const SYNC_PATH = "/api/apps/tackboard/sync";
const accountKey = (id: string) => `archeon:tackboard:account:${id}`;
const revisionKey = (id: string) => `archeon:tackboard:revision:${id}`;
const pendingKey = (id: string) => `archeon:tackboard:pending:${id}`;

/** Explicit, optimistic syncing. Never silently overwrite edits from another device. */
export function useTackCloud() {
  const [data, setData] = useState<TackboardData | null>(null);
  const [ready, setReady] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [message, setMessage] = useState("");
  const [hasGuestNotes, setHasGuestNotes] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
  const content = useRef<TackboardData | null>(null);
  const account = useRef<string | null>(null);
  const revision = useRef(0);
  const sequence = useRef(0);
  const committed = useRef(0);
  const inflight = useRef(false);
  const retries = useRef(0);
  const conflicted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const load = (value: TackboardData) => { content.current = value; setData(value); };
  const setTheme = useCallback((value: "light" | "dark") => {
    setThemeState(value);
    try { localStorage.setItem("archeon-app-theme", value); } catch { /* private mode */ }
  }, []);
  const persist = useCallback(() => {
    const next = content.current;
    if (!next) return;
    try {
      if (account.current) {
        localStorage.setItem(accountKey(account.current), JSON.stringify(next));
        localStorage.setItem(revisionKey(account.current), String(revision.current));
        localStorage.setItem(pendingKey(account.current), "1");
      } else localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch { setMessage("Browser storage is unavailable. Keep an exported backup of your notes."); }
  }, []);

  const schedule = useCallback((delay = 1100) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void saveRef.current(); }, delay);
  }, []);

  const edit = useCallback((apply: (previous: TackboardData) => TackboardData) => {
    if (!content.current) return;
    const next = apply(content.current);
    content.current = next;
    setData(next);
    sequence.current++;
    persist();
    if (account.current && !conflicted.current) {
      setStatus("saving"); schedule();
    }
  }, [persist, schedule]);

  const save = useCallback(async () => {
    const userId = account.current;
    if (!userId || !content.current || conflicted.current || inflight.current || sequence.current === committed.current) return;
    inflight.current = true;
    const sending = sequence.current;
    try {
      const response = await fetch(SYNC_PATH, {
        method: "PUT", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseRevision: revision.current, data: content.current }),
      });
      const result = await response.json();
      if (response.status === 409) {
        conflicted.current = true;
        setConflict({ data: result.data ? readStore(JSON.stringify(result.data)) : null, revision: result.revision });
        setStatus("conflict");
        return;
      }
      if (!response.ok) throw new Error(result.error || "Sync unavailable");
      revision.current = result.revision;
      committed.current = sending;
      retries.current = 0;
      localStorage.setItem(revisionKey(userId), String(revision.current));
      if (sending === sequence.current) {
        localStorage.removeItem(pendingKey(userId));
        setStatus("synced");
      } else { setStatus("saving"); }
    } catch {
      // Do not raise a toast for every background attempt. The sidebar reflects outages.
      retries.current = Math.min(retries.current + 1, 6);
      setStatus("offline");
    } finally {
      inflight.current = false;
      if (!conflicted.current && sequence.current !== committed.current && navigator.onLine) {
        // Push newer local edits first. Back off on repeated network failures.
        schedule(retries.current ? Math.min(30000, 1500 * (2 ** retries.current)) : 650);
      }
    }
  }, [schedule]);
  saveRef.current = save;

  useEffect(() => {
    let active = true;
    try {
      const appTheme = localStorage.getItem("archeon-app-theme");
      setThemeState(appTheme === "light" || appTheme === "dark" ? appTheme : (document.documentElement.dataset.theme === "light" ? "light" : "dark"));
    } catch { /* storage optional */ }
    void (async () => {
      let guest: TackboardData = initialData();
      try {
        const saved = localStorage.getItem(STORE_KEY);
        guest = readStore(saved) ?? guest;
        setHasGuestNotes(!!saved);
      } catch { setMessage("Browser storage is unavailable. Export backups to keep your notes."); }
      try {
        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
        const session = sessionResponse.ok ? await sessionResponse.json() : null;
        if (!active) return;
        if (!session?.signedIn || !session.userId) {
          load(guest); setStatus("guest"); return;
        }
        const id = String(session.userId);
        const cached = readStore(localStorage.getItem(accountKey(id)));
        const previousRevision = Number(localStorage.getItem(revisionKey(id)) || 0);
        const dirty = localStorage.getItem(pendingKey(id)) === "1";
        account.current = id; setAccountId(id); setAccountEmail(session.email);
        try {
          const result = await fetch(SYNC_PATH, { cache: "no-store" });
          if (!result.ok) throw new Error("Failed to load cloud boards");
          const remote = await result.json();
          if (!active) return;
          const serverData = remote.data ? readStore(JSON.stringify(remote.data)) : null;
          revision.current = Number(remote.revision || 0);
          if (dirty && cached) {
            load(cached);
            if (previousRevision !== revision.current) {
              conflicted.current = true;
              setConflict({ data: serverData, revision: revision.current });
              setStatus("conflict");
            } else {
              sequence.current = 1;
              setStatus("saving"); schedule(500);
            }
          } else {
            load(serverData ?? initialData());
            localStorage.setItem(accountKey(id), JSON.stringify(content.current));
            localStorage.setItem(revisionKey(id), String(revision.current));
            if (!serverData) {
              sequence.current = 1;
              setStatus("saving");
              schedule(500);
            } else setStatus("synced");
          }
        } catch {
          load(cached ?? initialData());
          revision.current = Number.isSafeInteger(previousRevision) ? previousRevision : 0;
          setStatus("offline");
          // Recheck even on first sign-in if the server was unreachable.
          sequence.current = 1;
        }
      } catch {
        load(guest); setStatus("guest");
        setMessage("Sign-in status couldn't be checked. Working locally for now.");
      } finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
  }, [schedule]);

  useEffect(() => {
    const check = () => {
      if (!account.current || conflicted.current || !content.current || inflight.current) return;
      if (sequence.current !== committed.current) { void saveRef.current(); return; }
      void fetch(SYNC_PATH, { cache: "no-store" }).then(async response => {
        if (!response.ok || conflicted.current || inflight.current || sequence.current !== committed.current) return;
        const cloud = await response.json();
        if (Number(cloud.revision) > revision.current) {
          const next = readStore(JSON.stringify(cloud.data));
          if (!next) return;
          revision.current = cloud.revision;
          load(next);
          localStorage.setItem(accountKey(account.current!), JSON.stringify(next));
          localStorage.setItem(revisionKey(account.current!), String(revision.current));
          setStatus("synced");
        }
      }).catch(() => {});
    };
    const interval = setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) check(); }, 20000);
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    return () => { clearInterval(interval); window.removeEventListener("online", check); window.removeEventListener("focus", check); };
  }, []);

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (account.current || event.key !== STORE_KEY || !event.newValue) return;
      const next = readStore(event.newValue);
      if (next) load(next);
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  const chooseConflict = useCallback((choice: "cloud" | "device") => {
    if (!conflict || !account.current) return;
    revision.current = conflict.revision;
    localStorage.setItem(revisionKey(account.current), String(revision.current));
    conflicted.current = false;
    setConflict(null);
    if (choice === "cloud") {
      // Always preserve the local draft before switching to another device's work.
      if (content.current) localStorage.setItem(`archeon:tackboard:recovery:${Date.now()}`, JSON.stringify(content.current));
      load(conflict.data ?? initialData());
      committed.current = sequence.current;
      localStorage.removeItem(pendingKey(account.current));
      localStorage.setItem(accountKey(account.current), JSON.stringify(content.current));
      setStatus("synced");
      setMessage("Cloud version loaded. Previous local draft saved in a recovery backup.");
    } else {
      sequence.current++;
      persist();
      setStatus("saving"); schedule(100);
    }
  }, [conflict, persist, schedule]);

  const importGuest = useCallback(() => {
    if (!account.current) return;
    const guest = readStore(localStorage.getItem(STORE_KEY));
    if (!guest) { setMessage("There are no guest notes to import."); return; }
    if (!window.confirm("Replace the current cloud board with this browser's guest notes? Your cloud data will be backed up on this device first.")) return;
    if (content.current) localStorage.setItem(`archeon:tackboard:recovery:${Date.now()}`, JSON.stringify(content.current));
    edit(() => guest);
    setMessage("Guest notes are queued for cloud sync.");
  }, [edit]);

  const signOut = useCallback(async () => {
    if (account.current && sequence.current !== committed.current) {
      await saveRef.current();
      if (sequence.current !== committed.current) { setMessage("You have unsynced notes. Reconnect before signing out, or export a backup."); return; }
    }
    try {
      const res = await fetch("/api/auth/session", { method: "DELETE" });
      if (!res.ok) throw new Error("Sign out failed");
      const previousId = account.current;
      if (previousId) {
        // Explicit sign-out removes private cached workspace data from shared browsers.
        localStorage.removeItem(accountKey(previousId));
        localStorage.removeItem(revisionKey(previousId));
        localStorage.removeItem(pendingKey(previousId));
        Object.keys(localStorage).filter(key => key.startsWith("archeon:tackboard:recovery:")).forEach(key => localStorage.removeItem(key));
      }
      account.current = null;
      setAccountEmail(null); setAccountId(null); setStatus("guest");
      load(readStore(localStorage.getItem(STORE_KEY)) ?? initialData());
      setMessage("Signed out. Guest notes remain separate from your account.");
    } catch { setMessage("Could not sign out. Please try again."); }
  }, []);

  return { data, ready, accountEmail, accountId, status, message, setMessage, conflict, chooseConflict,
    hasGuestNotes, importGuest, edit, replaceData: (next: TackboardData) => edit(() => next),
    syncNow: () => void saveRef.current(), signOut, theme, setTheme };
}
