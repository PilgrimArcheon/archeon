"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialData, readStore, STORE_KEY, type TackboardData } from "./model";
import { mergeTackDocuments } from "./merge";

export type SyncStatus = "loading" | "guest" | "synced" | "saving" | "offline" | "conflict";
type Conflict = { data: TackboardData | null; revision: number; reasons?: string[] };
const SYNC_PATH = "/api/apps/tackboard/sync";
const accountKey = (id: string) => `archeon:tackboard:account:${id}`;
const revisionKey = (id: string) => `archeon:tackboard:revision:${id}`;
const pendingKey = (id: string) => `archeon:tackboard:pending:${id}`;
const baselineKey = (id: string) => `archeon:tackboard:baseline:${id}`;
const same = (a: TackboardData, b: TackboardData) => JSON.stringify(a) === JSON.stringify(b);

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
  const [cloudRevision, setCloudRevision] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
  const content = useRef<TackboardData | null>(null);
  const account = useRef<string | null>(null);
  const revision = useRef(0);
  const baseline = useRef<TackboardData | null>(null);
  const sequence = useRef(0);
  const committed = useRef(0);
  const inflight = useRef(false);
  const retries = useRef(0);
  const conflicted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<() => Promise<boolean>>(async () => false);
  const checkRef = useRef<() => Promise<boolean>>(async () => false);
  const savePromise = useRef<Promise<boolean> | null>(null);
  const pullPromise = useRef<Promise<boolean> | null>(null);

  const load = (value: TackboardData) => { content.current = value; setData(value); };
  const recordCloud = (id: string, remote: TackboardData, rev: number) => {
    baseline.current = remote;
    revision.current = rev;
    setCloudRevision(rev);
    try {
      localStorage.setItem(baselineKey(id), JSON.stringify(remote));
      localStorage.setItem(revisionKey(id), String(rev));
    } catch { /* allow a temporary storage failure without discarding edits */ }
  };
  const setTheme = useCallback((value: "light" | "dark") => {
    setThemeState(value);
    document.documentElement.dataset.theme = value;
    try { localStorage.setItem("archeon-theme", value); } catch { /* private mode */ }
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

  // One upload at a time. Manual Save and background saves share the same promise,
  // so neither can acknowledge a revision that was never accepted by Neon.
  const save = useCallback(async (): Promise<boolean> => {
    const id = account.current;
    if (!id || !content.current || conflicted.current) return false;
    if (savePromise.current) return savePromise.current;
    if (sequence.current === committed.current) return true;
    const operation = (async (): Promise<boolean> => {
      inflight.current = true;
      const sending = sequence.current;
      const outgoing = content.current!;
      const baseRevision = revision.current;
      let retrySoon = false;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(SYNC_PATH, {
          method: "PUT", credentials: "same-origin", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseRevision, data: outgoing }),
        });
        let result: { error?: string; revision?: number; data?: unknown; saved?: boolean; accountId?: string };
        try { result = await response.json(); }
        catch { throw new Error(`Cloud returned an invalid response (HTTP ${response.status}).`); }
        if (response.status === 401) throw new Error("Your session expired. Sign in again before saving.");
        if (result.accountId && result.accountId !== id) throw new Error("Cloud account does not match this browser session. Save stopped.");
        if (response.status === 409) {
          const remote = result.data ? readStore(JSON.stringify(result.data)) : null;
          const remoteRevision = Number(result.revision);
          if (!remote || !Number.isSafeInteger(remoteRevision) || remoteRevision <= baseRevision)
            throw new Error("Could not read the latest cloud revision.");
          // Merge the LATEST local document, not the older snapshot we sent.
          // A user may have edited another field while the PUT was in flight.
          const current = content.current;
          if (!current) return false;
          const merged = baseline.current ? mergeTackDocuments(baseline.current, current, remote) : null;
          if (same(current, remote) || (merged && merged.conflicts.length === 0)) {
            const next = same(current, remote) ? remote : merged!.data;
            recordCloud(id, remote, remoteRevision);
            load(next);
            retries.current = 0;
            if (same(next, remote)) {
              committed.current = sequence.current;
              localStorage.setItem(accountKey(id), JSON.stringify(next));
              localStorage.removeItem(pendingKey(id));
              setStatus("synced");
              setLastSavedAt(Date.now());
            } else {
              sequence.current++;
              persist();
              setStatus("saving");
              retrySoon = true;
            }
            return true;
          }
          conflicted.current = true;
          setConflict({ data: remote, revision: remoteRevision, reasons: merged?.conflicts ?? ["Unknown common baseline"] });
          setMessage("Two devices changed the same information. Review the conflict before saving.");
          setStatus("conflict");
          return false;
        }
        if (!response.ok || result.saved !== true || !Number.isSafeInteger(result.revision) || Number(result.revision) <= baseRevision)
          throw new Error(result.error || `Cloud save was not confirmed (HTTP ${response.status}).`);
        // This acknowledges precisely the snapshot sent, not edits made since.
        recordCloud(id, outgoing, Number(result.revision));
        committed.current = sending;
        retries.current = 0;
        if (sending === sequence.current) {
          localStorage.removeItem(pendingKey(id));
          setStatus("synced");
          setLastSavedAt(Date.now());
          setMessage("");
        } else setStatus("saving");
        return true;
      } catch (error) {
        retries.current = Math.min(retries.current + 1, 6);
        setStatus("offline");
        setMessage(error instanceof Error ? error.message : "Cloud save failed. Your changes remain on this device.");
        return false;
      } finally {
        clearTimeout(timeout);
        inflight.current = false;
        if (!conflicted.current && sequence.current !== committed.current && navigator.onLine) {
          schedule(retrySoon ? 150 : retries.current ? Math.min(30000, 1500 * (2 ** retries.current)) : 650);
        }
      }
    })();
    savePromise.current = operation;
    try { return await operation; }
    finally { if (savePromise.current === operation) savePromise.current = null; }
  }, [persist, schedule]);
  saveRef.current = save;

  useEffect(() => {
    let active = true;
    try {
      setThemeState(document.documentElement.dataset.theme === "light" ? "light" : "dark");
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
        const previousBaseline = readStore(localStorage.getItem(baselineKey(id)));
        const dirty = localStorage.getItem(pendingKey(id)) === "1";
        account.current = id; setAccountId(id); setAccountEmail(session.email);
        baseline.current = previousBaseline;
        try {
          const result = await fetch(SYNC_PATH, { cache: "no-store" });
          if (!result.ok) throw new Error("Failed to load cloud boards");
          const remote = await result.json();
          if (!active) return;
          const serverData = remote.data ? readStore(JSON.stringify(remote.data)) : null;
          const cloudRevision = Number(remote.revision || 0);
          if (remote.accountId && String(remote.accountId) !== id) throw new Error("Cloud account identity mismatch.");
          if (dirty && cached) {
            if (previousRevision === cloudRevision || !serverData) {
              load(cached);
              revision.current = cloudRevision;
              if (serverData) recordCloud(id, serverData, cloudRevision);
              sequence.current = 1;
              setStatus("saving"); schedule(500);
            } else if (previousBaseline) {
              const merged = mergeTackDocuments(previousBaseline, cached, serverData);
              if (merged.conflicts.length) {
                load(cached);
                revision.current = cloudRevision;
                conflicted.current = true;
                setConflict({ data: serverData, revision: cloudRevision, reasons: merged?.conflicts ?? ["Unknown common baseline"] });
                setStatus("conflict");
              } else {
                load(merged.data);
                recordCloud(id, serverData, cloudRevision);
                if (same(merged.data, serverData)) {
                  localStorage.setItem(accountKey(id), JSON.stringify(merged.data));
                  localStorage.removeItem(pendingKey(id));
                  setStatus("synced");
                } else {
                  sequence.current = 1;
                  persist(); setStatus("saving"); schedule(500);
                }
              }
            } else {
              load(cached);
              revision.current = cloudRevision;
              conflicted.current = true;
              setConflict({ data: serverData, revision: cloudRevision, reasons: ["No common cloud baseline available"] });
              setStatus("conflict");
            }
          } else {
            const loaded = serverData ?? initialData();
            load(loaded);
            recordCloud(id, loaded, cloudRevision);
            localStorage.setItem(accountKey(id), JSON.stringify(loaded));
            if (!serverData) {
              sequence.current = 1;
              localStorage.setItem(pendingKey(id), "1");
              setStatus("saving"); schedule(500);
            } else { setStatus("synced"); setLastSavedAt(Date.now()); }
          }
        } catch {
          load(cached ?? initialData());
          revision.current = Number.isSafeInteger(previousRevision) ? previousRevision : 0;
          setStatus("offline");
          // Keep unsynced data untouched; wait for reconnection before retrying.
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
    const check = async (): Promise<boolean> => {
      const id = account.current;
      if (!id || conflicted.current || !content.current) return false;
      if (pullPromise.current) return pullPromise.current;
      if (inflight.current || sequence.current !== committed.current) return false;
      const atSequence = sequence.current;
      const operation = (async (): Promise<boolean> => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await fetch(SYNC_PATH, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
          if (!response.ok) throw new Error(`Cloud refresh failed (HTTP ${response.status}).`);
          const cloud = await response.json();
          if (cloud.accountId && String(cloud.accountId) !== id) throw new Error("Cloud account identity mismatch. Local edits are preserved.");
          const remoteRevision = Number(cloud.revision);
          if (!Number.isSafeInteger(remoteRevision)) throw new Error("Invalid cloud revision.");
          if (remoteRevision < revision.current) throw new Error("Cloud history is older than this device. Your local notes were preserved; check your account/database connection.");
          // The GET must not replace a local edit made after the request began.
          if (id !== account.current || conflicted.current || inflight.current ||
              sequence.current !== atSequence || sequence.current !== committed.current) return false;
          if (remoteRevision === revision.current && cloud.data && content.current) {
            const confirmed = readStore(JSON.stringify(cloud.data));
            if (confirmed && !same(confirmed, content.current)) {
              conflicted.current = true;
              setConflict({ data: confirmed, revision: remoteRevision, reasons: ["Local cache differs from the cloud at the same revision"] });
              setStatus("conflict");
              setMessage("Your local copy differs from the server. Export a backup before choosing a version.");
              return false;
            }
          }
          if (remoteRevision > revision.current) {
            const next = cloud.data ? readStore(JSON.stringify(cloud.data)) : null;
            if (!next) throw new Error("Cloud returned invalid board data.");
            recordCloud(id, next, remoteRevision);
            load(next);
            localStorage.setItem(accountKey(id), JSON.stringify(next));
            localStorage.removeItem(pendingKey(id));
          }
          setStatus("synced");
          setLastSavedAt(Date.now());
          setMessage("");
          return true;
        } catch (error) {
          // Do not show a loud toast on a background poll; keep diagnostic text.
          setStatus("offline");
          setMessage(error instanceof Error ? error.message : "Cloud refresh failed.");
          return false;
        } finally { clearTimeout(timeout); }
      })();
      pullPromise.current = operation;
      try { return await operation; }
      finally { if (pullPromise.current === operation) pullPromise.current = null; }
    };
    checkRef.current = check;
    const refresh = () => {
      if (!account.current || conflicted.current) return;
      if (sequence.current !== committed.current) void saveRef.current();
      else void checkRef.current();
    };
    const interval = setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) refresh(); }, 12000);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(interval); window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); };
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
    const id = account.current;
    const original = content.current;
    const before = baseline.current;
    // Exportable recovery backup is created regardless of which side wins.
    if (original) try { localStorage.setItem(`archeon:tackboard:recovery:${Date.now()}`, JSON.stringify(original)); }
    catch { setMessage("Backup storage is full. Export your notes before proceeding."); return; }
    const chosen = choice === "cloud"
      ? (conflict.data ?? initialData())
      : before && original && conflict.data
        // Preserve independent cloud changes; only fields BOTH sides edited
        // intentionally prefer this device when the user clicks Keep device.
        ? mergeTackDocuments(before, original, conflict.data, { preferLocalConflicts: true }).data
        : original;
    if (conflict.data) recordCloud(id, conflict.data, conflict.revision);
    else { revision.current = conflict.revision; localStorage.setItem(revisionKey(id), String(revision.current)); }
    conflicted.current = false;
    setConflict(null);
    if (!chosen) return;
    load(chosen);
    if (choice === "cloud" || (conflict.data && same(chosen, conflict.data))) {
      committed.current = sequence.current;
      localStorage.removeItem(pendingKey(id));
      localStorage.setItem(accountKey(id), JSON.stringify(chosen));
      setStatus("synced");
      setLastSavedAt(Date.now());
      setMessage("Cloud version loaded. The previous local draft is in your recovery backup.");
    } else {
      sequence.current++;
      persist();
      setStatus("saving");
      setMessage("Device edits selected; merging and uploading without discarding independent cloud changes.");
      schedule(100);
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
        localStorage.removeItem(baselineKey(previousId));
        Object.keys(localStorage).filter(key => key.startsWith("archeon:tackboard:recovery:")).forEach(key => localStorage.removeItem(key));
      }
      account.current = null;
      setAccountEmail(null); setAccountId(null); setStatus("guest");
      load(readStore(localStorage.getItem(STORE_KEY)) ?? initialData());
      setMessage("Signed out. Guest notes remain separate from your account.");
    } catch { setMessage("Could not sign out. Please try again."); }
  }, []);

  const flushToCloud = useCallback(async (refresh: boolean): Promise<boolean> => {
    if (!account.current) { setMessage("Sign in to save boards to the cloud."); return false; }
    if (conflicted.current) { setMessage("Resolve the outstanding cloud conflict first."); return false; }
    if (timer.current) clearTimeout(timer.current);
    // A newer local edit can arrive during a PUT. Keep flushing until all edits
    // have a matching server acknowledgement, with a bounded retry budget.
    for (let attempt = 0; attempt < 6 && sequence.current !== committed.current; attempt++) {
      if (!await saveRef.current()) return false;
    }
    if (sequence.current !== committed.current) {
      setStatus("saving");
      setMessage("More changes are queued. Please try Save again.");
      schedule(250);
      return false;
    }
    if (refresh) return checkRef.current();
    setStatus("synced");
    setLastSavedAt(Date.now());
    return true;
  }, [schedule]);

  return { data, ready, accountEmail, accountId, status, message, setMessage, conflict, chooseConflict,
    hasGuestNotes, importGuest, edit, replaceData: (next: TackboardData) => edit(() => next),
    syncNow: () => flushToCloud(true), saveNow: () => flushToCloud(false), cloudRevision, lastSavedAt, signOut, theme, setTheme };
}
