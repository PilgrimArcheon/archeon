"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDownToLine, ArrowLeft, Archive, ArrowUpRight, Check, CheckCheck, ChevronDown, CircleHelp, Cloud, CloudOff, Monitor, Moon, Sun, Link2, Copy, RefreshCw,
  ClipboardList, Grip, Menu, MoreHorizontal, Pencil, Pin, Plus, RotateCcw,
  Search, Share2, Trash2, X,
} from "lucide-react";
import {
  allTasksComplete, COLORS, freshId, makeBoard, makeNote, progress, readStore,
  STATUSES, type Note, type NoteColor, type NoteStatus,
} from "@/features/tackboard/model";
import styles from "./tackboard.module.css";
import { useTackCloud } from "@/features/tackboard/useTackCloud";

type Dialog = "note" | "board" | "help" | null;
type Filter = "all" | NoteStatus;
const now = () => Date.now();
const noteColorNames: Record<NoteColor, string> = {
  butter: "Golden", mint: "Sage", lilac: "Lilac", rose: "Blush", sky: "Blue", paper: "Paper",
};
const displayDate = (n: number) => new Date(n).toLocaleDateString(undefined, { month: "short", day: "numeric" });
function downloadText(name: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: "application/json;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TackboardClient() {
  const { data, ready, accountEmail, accountId, status: syncStatus, message: syncMessage,
    setMessage: setSyncMessage, conflict: syncConflict, chooseConflict, hasGuestNotes,
    importGuest, edit: mutate, replaceData, syncNow, signOut, theme, setTheme } = useTackCloud();
  const [pairToken, setPairToken] = useState("");
  const [pairedDevices, setPairedDevices] = useState<{id:string;label:string}[]>([]);
  const [showDevices, setShowDevices] = useState(false);
  const [pairBusy, setPairBusy] = useState(false);
  async function loadDevices() {
    try {
      const res = await fetch("/api/apps/tackboard/extension");
      if (res.ok) setPairedDevices((await res.json()).devices ?? []);
    } catch { setNotice("Unable to load paired devices."); }
  }
  async function pairDevice() {
    setPairBusy(true);
    try {
      const res = await fetch("/api/apps/tackboard/extension", {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({label:"TackBoard Desktop"}),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not pair device.");
      setPairToken(result.token); await loadDevices();
    } catch (err) { setNotice(err instanceof Error ? err.message : "Unable to create pairing token."); }
    finally { setPairBusy(false); }
  }
  async function revokeDevice(id: string) {
    try {
      const res = await fetch("/api/apps/tackboard/extension", {
        method: "DELETE", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      await loadDevices(); setNotice("Companion device disconnected.");
    } catch { setNotice("Unable to disconnect device."); }
  }
  const [selectedBoard, setSelectedBoard] = useState("");
  useEffect(() => { try { setSelectedBoard(localStorage.getItem("archeon:tackboard:selected-board") || ""); } catch { /* optional preference */ } }, []);
  const [showArchive, setShowArchive] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [draft, setDraft] = useState<Note | null>(null);
  const [boardName, setBoardName] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [animating, setAnimating] = useState<string[]>([]);
  const [lastArchived, setLastArchived] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const boardRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const pendingArchive = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Track pointer movement outside React's render loop. A board write happens only on release.
  const draggingRef = useRef<{
    id: string; pointer: number; startX: number; startY: number;
    x: number; y: number; nextX: number; nextY: number; layer: number;
    element: HTMLElement; handle: HTMLButtonElement; frame: number | null;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => () => { pendingArchive.current.forEach(clearTimeout); pendingArchive.current.clear(); }, []);
  useEffect(() => {
    if (!lastArchived && !notice) return;
    const timer = setTimeout(() => { setLastArchived(null); setNotice(""); }, 7000);
    return () => clearTimeout(timer);
  }, [lastArchived, notice]);

  const boardId = data?.boards.some(board => board.id === selectedBoard) ? selectedBoard : data?.activeBoardId ?? "";
  const board = data?.boards.find(item => item.id === boardId);
  const boardNotes = useMemo(() => data?.notes.filter(note => note.boardId === boardId) ?? [], [data, boardId]);
  const activeNotes = useMemo(() => boardNotes.filter(note => !note.archivedAt), [boardNotes]);
  const archivedNotes = useMemo(() => boardNotes.filter(note => !!note.archivedAt), [boardNotes]);
  const displayed = useMemo(() => (showArchive ? archivedNotes : activeNotes).filter(note => {
    const query = search.trim().toLowerCase();
    return (showArchive || filter === "all" || note.status === filter) &&
      (!query || `${note.title} ${note.body} ${note.tasks.map(task => task.text).join(" ")}`.toLowerCase().includes(query));
  }).sort((a, b) => a.layer - b.layer), [activeNotes, archivedNotes, filter, search, showArchive]);
  const totalTasks = activeNotes.reduce((total, note) => total + progress(note).total, 0);
  const completeTasks = activeNotes.reduce((total, note) => total + progress(note).done, 0);
  const canvasHeight = Math.max(730, ...boardNotes.map(note => note.y + 365));
  // On touch screens the full spatial board scrolls horizontally instead of collapsing to a grid.
  const canvasWidth = Math.max(850, ...boardNotes.map(note => note.x + 280));

  const chooseBoard = (id: string) => {
    setSelectedBoard(id);
    // Selection is a per-device preference, not a cloud document edit.
    try { localStorage.setItem("archeon:tackboard:selected-board", id); } catch { /* optional preference */ }
    setShowArchive(false); setFilter("all"); setSearch(""); setMobileNav(false);
  };
  const startNote = () => {
    if (!boardId) return;
    const draftNote = makeNote(boardId, activeNotes.length);
    // Keep newly created notes visible even on narrower canvases.
    const canvasWidth = boardRef.current?.clientWidth ?? 1000;
    const columns = Math.max(1, Math.floor((canvasWidth - 38) / 272));
    draftNote.x = 26 + (activeNotes.length % columns) * 272;
    draftNote.y = 28 + Math.floor(activeNotes.length / columns) * 312;
    setFilter("all"); setDraft(draftNote); setDialog("note");
  };
  const editNote = (note: Note) => { setDraft(structuredClone(note)); setDialog("note"); };
  const saveNote = () => {
    if (!draft || !draft.title.trim()) return;
    const clean = { ...draft, title: draft.title.trim().slice(0, 90), body: draft.body.slice(0, 1200),
      tasks: draft.tasks.filter(t => t.text.trim()).map(t => ({ ...t, text: t.text.trim().slice(0, 180) })).slice(0, 35), updatedAt: now() };
    mutate(d => ({ ...d, notes: d.notes.some(n => n.id === clean.id) ? d.notes.map(n => n.id === clean.id ? clean : n) : [...d.notes, clean] }));
    setDialog(null); setDraft(null); setShowArchive(false); setSearch("");
  };
  const patchNote = (id: string, apply: (note: Note) => Note) => mutate(d => ({
    ...d, notes: d.notes.map(n => n.id === id ? { ...apply(n), updatedAt: now() } : n),
  }));
  const archiveNote = (id: string) => {
    const timer = pendingArchive.current.get(id);
    if (timer) clearTimeout(timer);
    pendingArchive.current.delete(id);
    setAnimating(ids => ids.filter(v => v !== id));
    patchNote(id, n => ({ ...n, status: "done", archivedAt: now() }));
    setLastArchived(id);
  };
  const queueArchive = (id: string) => {
    if (pendingArchive.current.has(id)) return;
    setAnimating(ids => [...ids, id]);
    // Fallback for hidden tabs / disabled animations; normal completion uses animationend.
    const timer = setTimeout(() => { archiveNote(id); }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 150 : 1750);
    pendingArchive.current.set(id, timer);
  };
  const toggleTask = (note: Note, taskId: string) => {
    const next = { ...note, status: note.status === "planned" ? "active" as const : note.status,
      tasks: note.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) };
    patchNote(note.id, () => next);
    if (allTasksComplete(next)) queueArchive(note.id);
    else if (pendingArchive.current.has(note.id)) {
      clearTimeout(pendingArchive.current.get(note.id)); pendingArchive.current.delete(note.id);
      setAnimating(ids => ids.filter(id => id !== note.id));
    }
  };
  const restoreNote = (id: string) => {
    patchNote(id, n => ({ ...n, status: "active", archivedAt: null }));
    setLastArchived(null);
  };
  const removeNote = (id: string) => {
    if (!window.confirm("Delete this note permanently? This cannot be undone.")) return;
    mutate(d => ({ ...d, notes: d.notes.filter(n => n.id !== id) })); setDialog(null);
  };
  const createBoard = () => {
    const name = boardName.trim();
    if (!name || (data?.boards.length ?? 0) >= 100) return;
    const next = makeBoard(name);
    mutate(d => ({ ...d, boards: [...d.boards, next], activeBoardId: next.id }));
    setSelectedBoard(next.id); setBoardName(""); setDialog(null); setShowArchive(false); setFilter("all"); setMobileNav(false);
  };
  const renameBoard = () => {
    if (!board) return;
    const updated = window.prompt("Rename board", board.name);
    if (!updated?.trim()) return;
    mutate(d => ({ ...d, boards: d.boards.map(b => b.id === board.id ? { ...b, name: updated.trim().slice(0, 58) } : b) }));
  };
  const deleteBoard = () => {
    if (!board || !data || data.boards.length === 1) { setNotice("Keep at least one board in your workspace."); return; }
    if (!window.confirm(`Delete “${board.name}” and ALL its notes permanently?`)) return;
    const nextId = data.boards.find(b => b.id !== board.id)!.id;
    mutate(d => ({ ...d, boards: d.boards.filter(b => b.id !== board.id), notes: d.notes.filter(n => n.boardId !== board.id), activeBoardId: nextId }));
    setSelectedBoard(nextId); setShowArchive(false);
  };
  const exportBackup = () => { if (data) downloadText(`tackboard-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(data, null, 2)); };
  const exportRecovery = () => {
    const latest = Object.keys(localStorage).filter(key => key.startsWith("archeon:tackboard:recovery:")).sort().pop();
    const stored = latest ? localStorage.getItem(latest) : null;
    if (!stored) { setNotice("No local recovery backups are available."); return; }
    downloadText(`tackboard-recovery-${new Date().toISOString().slice(0,10)}.json`, stored);
    setNotice("Recovery backup downloaded. Use Import backup to restore it if needed.");
  };
  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_500_000) { setNotice("Backup is too large (maximum 1.5 MB)."); return; }
    const imported = readStore(await file.text());
    if (!imported) { setNotice("This isn't a valid Tackboard backup."); return; }
    if (!window.confirm("Replace all notes and boards on this device with this backup?")) return;
    replaceData(imported); setSelectedBoard(imported.activeBoardId); setShowArchive(false); setNotice("Backup imported successfully.");
  };
  const dragStart = (event: ReactPointerEvent<HTMLButtonElement>, note: Note) => {
    // Pointer Events support mouse, pen, and iOS/Android touch. The handle disables
    // touch panning, while the rest of the board remains horizontally scrollable.
    if (event.button !== 0 || showArchive || draggingRef.current) return;
    const element = event.currentTarget.closest("article") as HTMLElement | null;
    if (!element) return;
    event.preventDefault();
    const highest = Math.max(0, ...(data?.notes.map(item => item.layer) ?? []));
    const layer = Math.min(100000, highest + 1);
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    element.style.zIndex = String(layer);
    draggingRef.current = {
      id: note.id, pointer: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: note.x, y: note.y, nextX: note.x, nextY: note.y, layer,
      element, handle, frame: null,
    };
    document.body.style.userSelect = "none";
    setDraggingId(note.id);
  };

  useEffect(() => {
    const paintDrag = () => {
      const drag = draggingRef.current;
      if (!drag) return;
      drag.frame = null;
      drag.element.style.setProperty("--drag-x", `${drag.nextX - drag.x}px`);
      drag.element.style.setProperty("--drag-y", `${drag.nextY - drag.y}px`);
    };
    const move = (event: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag || event.pointerId !== drag.pointer) return;
      const maxX = Math.max(0, (boardRef.current?.clientWidth ?? 1150) - drag.element.offsetWidth);
      drag.nextX = Math.max(0, Math.min(maxX, drag.x + event.clientX - drag.startX));
      // Keep the whole note visible; the board grows when notes are added below.
      const maxY = Math.max(0, (boardRef.current?.clientHeight ?? 730) - drag.element.offsetHeight - 8);
      drag.nextY = Math.max(0, Math.min(maxY, drag.y + event.clientY - drag.startY));
      if (drag.frame === null) drag.frame = window.requestAnimationFrame(paintDrag);
    };
    const finish = (event: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag || event.pointerId !== drag.pointer) return;
      move(event);
      if (drag.frame !== null) cancelAnimationFrame(drag.frame);
      draggingRef.current = null;
      document.body.style.userSelect = "";
      // Update the DOM position before removing its temporary transform, avoiding a snap-back.
      drag.element.style.left = `${drag.nextX}px`;
      drag.element.style.top = `${drag.nextY}px`;
      drag.element.style.removeProperty("--drag-x");
      drag.element.style.removeProperty("--drag-y");
      if (drag.handle.hasPointerCapture(drag.pointer)) drag.handle.releasePointerCapture(drag.pointer);
      setDraggingId(null);
      if (drag.nextX !== drag.x || drag.nextY !== drag.y || drag.layer > 0) {
        mutate(previous => ({ ...previous, notes: previous.notes.map(note => note.id === drag.id
          ? { ...note, x: drag.nextX, y: drag.nextY, layer: drag.layer, updatedAt: now() }
          : note) }));
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      const drag = draggingRef.current;
      if (drag?.frame != null) cancelAnimationFrame(drag.frame);
      if (drag) { drag.element.style.removeProperty("--drag-x"); drag.element.style.removeProperty("--drag-y"); }
      draggingRef.current = null;
      document.body.style.userSelect = "";
    };
  }, [mutate]);

  if (!ready || !data) return <div className={styles.loading}>Loading your board<span>…</span></div>;
  return <div className={`${styles.app} archeon-app-surface`} data-tack-theme={theme}>
    <aside className={`${styles.sidebar} ${mobileNav ? styles.sidebarOpen : ""}`} aria-label="Tackboard sidebar">
      <div className={styles.brand}><div className={styles.brandMark}><Image src="/images/tackboard-icon.png" alt="" width={35} height={35}/></div><div><strong>tackboard<span>.</span></strong><small>Make room for doing.</small></div><button className={styles.mobileClose} onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18}/></button></div>
      <Link className={styles.allAppsLink} href="/app"><ArrowLeft size={15}/> All apps</Link>
      <div className={styles.sidebarLabel}>WORKSPACE <span>{accountEmail ? "CLOUD / PERSONAL" : "LOCAL / PERSONAL"}</span></div>
      <div className={styles.boardHeading}><strong>Your boards</strong><button title="Create board" aria-label="Create board" onClick={() => { setBoardName(""); setDialog("board"); }}><Plus size={17}/></button></div>
      <nav className={styles.boardList} aria-label="Boards">{data.boards.map(b => <button key={b.id} aria-current={boardId === b.id ? "page" : undefined} className={`${styles.boardItem} ${boardId === b.id ? styles.boardSelected : ""}`} onClick={() => chooseBoard(b.id)}><span className={styles.boardDot}/><span>{b.name}</span><span className={styles.boardCount}>{data.notes.filter(n => n.boardId === b.id && !n.archivedAt).length}</span></button>)}</nav>
      <div className={styles.sidebarRule}/>
      <div className={styles.sidebarActions}>
        <button className={showArchive ? styles.activeAction : ""} onClick={() => { setShowArchive(v => !v); setMobileNav(false); }}><Archive size={17}/> Completed notes <span>{archivedNotes.length}</span></button>
        <button onClick={() => setDialog("help")}><CircleHelp size={17}/> How it works</button>
      </div>
      <div className={styles.sidebarBottom}>
        <div className={styles.cloudSummary} role="status">
          <span className={styles.greenDot}/>
          <div><strong>{accountEmail ? "Personal cloud" : "Local workspace"}</strong><small>{syncStatus === "conflict" ? "A real edit conflict needs review" : syncStatus === "offline" ? "Offline · changes kept on device" : syncStatus === "saving" ? "Saving changes…" : accountEmail ? "Changes save quietly" : "Saved on this device"}</small></div>
        </div>
        <details className={styles.sideDisclosure}>
          <summary><span><Cloud size={16}/> Cloud & desktop</span><ChevronDown size={15}/></summary>
          <div className={styles.sideDisclosureBody}>
            <Link href="/app/tackboard/desktop" className={styles.sideItem}><Monitor size={15}/> Get desktop TackBoard <ArrowUpRight size={13}/></Link>
            {accountId && <>
              <button className={styles.sideItem} onClick={syncNow}><RefreshCw size={14}/> Sync now</button>
              {hasGuestNotes && <button className={styles.sideItem} onClick={importGuest}>Move guest notes to cloud</button>}
              <button className={styles.sideItem} onClick={() => { setShowDevices(v=>!v); if (!showDevices) void loadDevices(); }}><Link2 size={14}/> Desktop companion</button>
              {showDevices && <div className={styles.devices}><strong>Connect TackBoard Desktop</strong><p>Generate a pairing key and paste it into the desktop Settings.</p><button className={styles.exportButton} disabled={pairBusy} onClick={pairDevice}>Generate pairing key</button>
                {pairToken && <div className={styles.pairKey}><code>{pairToken}</code><button onClick={() => { navigator.clipboard.writeText(pairToken).then(()=>setNotice("Pairing key copied.")).catch(()=>setNotice("Select and copy the key.")); }} aria-label="Copy pairing key"><Copy size={15}/></button></div>}
                <small>Shown once; keep this key private. Expires after 90 days.</small>
                {pairedDevices.map(d => <div key={d.id} className={styles.deviceRow}><span>{d.label}</span><button onClick={()=>revokeDevice(d.id)}>Revoke</button></div>)}
              </div>}
            </>}
          </div>
        </details>
        <details className={styles.sideDisclosure}>
          <summary><span><ArrowDownToLine size={16}/> Backup & account</span><ChevronDown size={15}/></summary>
          <div className={styles.sideDisclosureBody}>
            <button className={styles.sideItem} onClick={exportBackup}><ArrowDownToLine size={15}/> Export backup</button>
            <button className={styles.sideItem} onClick={() => importRef.current?.click()}>Import backup</button>
            {accountId && <button className={styles.sideItem} onClick={exportRecovery}>Download recovery backup</button>}
            {accountEmail ? <button className={styles.sideItem} onClick={signOut}>Sign out of Archeon</button> : <Link href="/app/auth/sign-in?next=%2Fapp%2Ftackboard" className={styles.sideItem}>Create account / Sign in</Link>}
          </div>
        </details>
        <input hidden ref={importRef} type="file" accept="application/json,.json" onChange={async e => { await importBackup(e.target.files?.[0]); e.target.value = ""; }}/>
      </div>
    </aside>
    {mobileNav && <button className={styles.navScrim} aria-label="Close menu" onClick={() => setMobileNav(false)}/>}

    <main className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.breadcrumb}><button className={styles.menuButton} onClick={() => setMobileNav(true)} aria-label="Open board menu"><Menu size={20}/></button><span>MY WORKSPACE</span><span className={styles.chevron}>/</span><strong>{board?.name ?? "Board"}</strong></div>
        <div className={styles.topActions}><button className={styles.themeSwitch} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-label="Toggle TackBoard color theme">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}<span>{theme === "dark" ? "LIGHT" : "DARK"}</span></button><span className={styles.syncState} aria-label={syncStatus === "offline" ? "Offline, edits stored locally" : syncStatus === "conflict" ? "Sync conflict needs attention" : accountId ? "Cloud backup enabled" : "Saved on this device"} title={syncStatus === "offline" ? "Offline — edits are safe on this device and will retry" : syncStatus === "conflict" ? "Resolve the cloud conflict below" : accountId ? "Cloud backup runs automatically" : "Local-only board"}>{syncStatus === "offline" || syncStatus === "conflict" ? <CloudOff size={15}/> : accountId ? <Cloud size={15}/> : <Monitor size={15}/>} {syncStatus === "offline" ? "OFFLINE" : syncStatus === "conflict" ? "ACTION NEEDED" : accountId ? "CLOUD" : "LOCAL"}</span><span className={styles.privateLabel}><span className={styles.greenDot}/> PERSONAL BOARD</span><button className={styles.topHelp} onClick={() => setDialog("help")} aria-label="About Tackboard"><CircleHelp size={18}/></button><Link className={styles.topBack} href="/app"><ArrowUpRight size={17}/> Archeon Apps</Link></div>
      </header>
      <div className={styles.workspace}>
        <div className={styles.headingRow}><div><div className={styles.eyebrow}><span className={styles.greenDot}/> YOUR SPACE TO THINK CLEARLY</div><h1>{showArchive ? "Off the board." : board?.name ?? "Your board"}<span className={styles.headingPeriod}>.</span></h1><p>{showArchive ? "Finished notes stay here until you choose to restore or delete them." : "Make a note. Make some progress. Peel it away."}</p></div><div className={styles.headingActions}>{!showArchive && <button className={styles.primaryButton} onClick={startNote}><Plus size={17}/> New sticky note</button>}<button className={styles.iconButton} title="Rename board" aria-label="Rename board" onClick={renameBoard}><Pencil size={17}/></button><button className={styles.iconButton} title="Delete board" aria-label="Delete board" onClick={deleteBoard}><Trash2 size={17}/></button></div></div>
        <div className={styles.summaryRow}><div className={styles.summaryUnit}><strong>{String(activeNotes.length).padStart(2,"0")}</strong><span>ON THE BOARD</span></div><div className={styles.summaryUnit}><strong>{String(completeTasks).padStart(2,"0")} <em>/ {String(totalTasks).padStart(2,"0")}</em></strong><span>TASKS TICKED OFF</span></div><div className={styles.summaryUnit}><strong>{String(archivedNotes.length).padStart(2,"0")}</strong><span>NOTES PEELED AWAY</span></div><div className={styles.summaryProgress}><span>SMALL STEPS ADD UP</span><div><i style={{width:`${totalTasks ? Math.round(completeTasks/totalTasks*100) : 0}%`}} /></div></div></div>
        <div className={styles.toolsRow}><div className={styles.filterTabs} aria-label="Filter notes">{!showArchive ? <><button className={filter === "all" ? styles.currentFilter : ""} onClick={() => setFilter("all")}>All notes</button>{STATUSES.filter(s => s.id !== "done").map(s => <button className={filter === s.id ? styles.currentFilter : ""} key={s.id} onClick={() => setFilter(s.id)}>{s.label}</button>)}</> : <button className={styles.currentFilter} onClick={() => setShowArchive(false)}>Completed <X size={13}/></button>}</div><label className={styles.searchBox}><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a note..." aria-label="Search notes"/></label></div>
        <section className={styles.canvasSection} aria-label={showArchive ? "Completed sticky notes" : "Sticky note board"}>
          <div className={styles.canvasMeta}><span><Pin size={14}/> {showArchive ? "ARCHIVED NOTES" : "THE PINBOARD"}</span><span>{showArchive ? "RESTORE ANYTIME" : "DRAG NOTES BY THE GRIP · TAP ··· TO EDIT"}</span></div>
          <div ref={boardRef} className={`${styles.boardCanvas} ${showArchive ? styles.archiveCanvas : ""}`} style={{ minHeight: showArchive ? 460 : canvasHeight, minWidth: canvasWidth }}>
            {displayed.length === 0 ? <div className={styles.empty}><div className={styles.emptyIcon}><ClipboardList size={28}/></div><h2>{search ? "No matching notes." : showArchive ? "Nothing peeled away yet." : "A fresh page."}</h2><p>{search ? "Try searching for something else." : showArchive ? "Finished notes will appear here." : "Every good plan starts with one note."}</p>{!showArchive && !search && <button className={styles.primaryButton} onClick={startNote}><Plus size={17}/> Create your first note</button>}</div> : displayed.map(note => {
              const amount = progress(note);
              return <article key={note.id} className={`${styles.sticky} ${styles[`color_${note.color}`]} ${animating.includes(note.id) ? styles.peeling : ""} ${draggingId === note.id ? styles.dragging : ""}`} style={{ left: note.x, top: note.y, zIndex: Math.max(1,note.layer) }} onAnimationEnd={e => { if (e.target === e.currentTarget && e.animationName.includes("peelAway") && pendingArchive.current.has(note.id)) archiveNote(note.id); }} onDoubleClick={() => editNote(note)} aria-label={`${note.title}, ${amount.done} of ${amount.total} tasks completed`}>
                <div className={styles.noteTop}><button className={styles.dragHandle} title="Drag note" aria-label={`Drag ${note.title}`} onPointerDown={e => dragStart(e,note)}><Grip size={18}/></button><span className={styles.noteStatus}>{STATUSES.find(s => s.id === note.status)?.label.toUpperCase()}</span><button className={styles.noteEdit} title="Edit note" aria-label={`Edit ${note.title}`} onClick={() => editNote(note)}><MoreHorizontal size={19}/></button></div>
                <h3>{note.title}</h3>{note.body && <p className={styles.noteBody}>{note.body}</p>}
                {note.tasks.length > 0 && <ul className={styles.taskList}>{note.tasks.map(task => <li key={task.id}><label className={`${styles.taskLabel} ${task.done ? styles.taskDone : ""}`}><input type="checkbox" checked={task.done} onChange={() => toggleTask(note, task.id)} disabled={showArchive} /><span className={styles.taskCheck}><Check size={12}/></span><span className={styles.taskText}>{task.text}</span></label></li>)}</ul>}
                <div className={styles.noteFooter}><span>{amount.total > 0 ? `${amount.done}/${amount.total} done` : `Added ${displayDate(note.createdAt)}`}</span><button aria-label={showArchive ? `Restore ${note.title}` : `Peel ${note.title} off the board`} title={showArchive ? "Restore note" : "Peel note off the board"} onClick={() => showArchive ? restoreNote(note.id) : queueArchive(note.id)}>{showArchive ? <RotateCcw size={16}/> : <ArrowUpRight size={16}/>}</button></div>
                {amount.total > 0 && <div className={styles.noteProgress}><i style={{ width:`${amount.done/amount.total*100}%` }}/></div>}
                {animating.includes(note.id) && <span className={styles.peelBadge}><CheckCheck size={18}/> {allTasksComplete(note) ? "All done!" : "Peeling away"}</span>}
              </article>;
            })}
            {!showArchive && displayed.length > 0 && !search && filter === "all" && <button className={styles.addOnCanvas} onClick={startNote}><Plus size={25}/><span>New note</span></button>}
          </div>
        </section>
        <div className={styles.pageFoot}><span>Small things become big things. One note at a time.</span><span>tackboard. / built by <Link href="/">archeon</Link></span></div>
      </div>
    </main>
    {syncConflict && <div className={styles.conflictPanel} role="alertdialog" aria-label="Cloud synchronization conflict"><strong>Changes from another device</strong><p>Your cloud board changed while this device was editing. Choose which version to keep. Loading the cloud version preserves your local draft in a browser recovery backup.</p><div><button onClick={() => chooseConflict("cloud")}>Use cloud version</button><button onClick={() => { if (window.confirm("Replace the newer cloud board with this device's board?")) chooseConflict("device"); }}>Keep this device&apos;s version</button></div></div>}
    {(lastArchived || notice || syncMessage) && <div className={styles.toast} role="status"><span>{syncMessage || notice || "A note was peeled off your board."}</span>{lastArchived && !syncMessage && <button onClick={() => restoreNote(lastArchived)}>Undo</button>}{(notice || syncMessage) && <button onClick={() => { setNotice(""); setSyncMessage(""); }} aria-label="Dismiss"><X size={14}/></button>}</div>}
    {dialog && <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) { setDialog(null); setDraft(null); } }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="tack-dialog-title" onKeyDown={e => { if (e.key === "Escape") { setDialog(null); setDraft(null); } }}>
        <div className={styles.modalHeader}><div><span>{dialog === "note" ? "STICKY NOTE" : dialog === "board" ? "YOUR WORKSPACE" : "A LITTLE GUIDE"}</span><h2 id="tack-dialog-title">{dialog === "note" ? (draft && data.notes.some(n => n.id === draft.id) ? "Edit your note" : "A fresh note") : dialog === "board" ? "New board" : "Make it yours"}</h2></div><button className={styles.iconButton} onClick={() => { setDialog(null); setDraft(null); }} aria-label="Close"><X size={20}/></button></div>
        {dialog === "board" && <form onSubmit={e => { e.preventDefault(); createBoard(); }}><label className={styles.fieldLabel}>BOARD NAME<input autoFocus value={boardName} onChange={e => setBoardName(e.target.value.slice(0,58))} placeholder="e.g. Website launch" required maxLength={58}/></label><div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={() => setDialog(null)}>Cancel</button><button className={styles.primaryButton} type="submit"><Plus size={16}/> Create board</button></div></form>}
        {dialog === "note" && draft && <form onSubmit={e => { e.preventDefault(); saveNote(); }}><label className={styles.fieldLabel}>TITLE<input autoFocus value={draft.title} maxLength={90} onChange={e => setDraft({ ...draft, title:e.target.value })} placeholder="What are you working on?" required/></label><label className={styles.fieldLabel}>A LITTLE CONTEXT (OPTIONAL)<textarea value={draft.body} maxLength={1200} onChange={e => setDraft({ ...draft, body:e.target.value })} placeholder="A quick thought, reminder or goal..." rows={3}/></label>
          <div className={styles.twoFields}><label className={styles.fieldLabel}>STATUS<select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as NoteStatus })}>{STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label><div className={styles.fieldLabel}>PAPER COLOR<div className={styles.colorChoices}>{COLORS.map(color => <button type="button" key={color} title={noteColorNames[color]} aria-label={noteColorNames[color]} aria-pressed={draft.color === color} className={`${styles.colorChoice} ${styles[`color_${color}`]} ${draft.color === color ? styles.colorChosen : ""}`} onClick={() => setDraft({ ...draft, color })}>{draft.color === color && <Check size={14}/>}</button>)}</div></div></div>
          <div className={styles.editorTasks}><div className={styles.editorTasksTop}><span>CHECKLIST <small>({draft.tasks.length}/35)</small></span><button type="button" onClick={() => { if (draft.tasks.length < 35) setDraft({ ...draft, tasks:[...draft.tasks,{id:freshId(),text:"",done:false}] }); }}><Plus size={15}/> Add task</button></div>{draft.tasks.map((task,i) => <div key={task.id} className={styles.editorTask}><button aria-label={task.done ? "Mark incomplete" : "Mark complete"} title="Toggle completed" type="button" onClick={() => setDraft({ ...draft, tasks:draft.tasks.map(t => t.id === task.id ? {...t,done:!t.done} : t) })}><span className={task.done ? styles.editorChecked : styles.editorUnchecked}>{task.done && <Check size={13}/>}</span></button><input aria-label={`Task ${i+1}`} placeholder={`Task ${i+1}`} value={task.text} maxLength={180} onChange={e => setDraft({ ...draft, tasks:draft.tasks.map(t => t.id === task.id ? {...t,text:e.target.value} : t) })}/><button aria-label={`Remove task ${i+1}`} title="Remove task" type="button" onClick={() => setDraft({ ...draft, tasks:draft.tasks.filter(t => t.id !== task.id) })}><X size={15}/></button></div>)}</div>
          <div className={styles.modalActions}>{data.notes.some(n => n.id === draft.id) && <button type="button" className={styles.deleteButton} onClick={() => removeNote(draft.id)}><Trash2 size={15}/> Delete</button>}<button type="button" className={styles.secondaryButton} onClick={() => { setDialog(null); setDraft(null); }}>Cancel</button><button type="submit" className={styles.primaryButton}><Check size={16}/> Save note</button></div></form>}
        {dialog === "help" && <div className={styles.helpContent}><div><Pin size={19}/><p><strong>Stick your thoughts down.</strong> Add boards, sticky notes, and as many as 35 checklist tasks per note.</p></div><div><Grip size={19}/><p><strong>Arrange your board.</strong> Drag a note by its grip with your finger or mouse. Tap the three dots to edit.</p></div><div><CheckCheck size={19}/><p><strong>Peel away finished notes.</strong> Complete every checklist task to trigger an animation and move the note to Completed. You can restore it later.</p></div><div><Share2 size={19}/><p><strong>Synced across devices.</strong> Sign in with your Archeon account to back up your personal boards. Connect TackBoard Desktop from the sidebar. Shared editing and invitations are a separate future feature.</p></div><button className={styles.primaryButton} onClick={() => setDialog(null)}>Got it <Check size={16}/></button></div>}
      </div>
    </div>}
  </div>;
}
