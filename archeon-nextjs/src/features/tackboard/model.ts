/** Tackboard v1: deliberately local-first. Never put account or shared-board data in this store. */
export type NoteColor = "butter" | "mint" | "lilac" | "rose" | "sky" | "paper";
export type NoteStatus = "planned" | "active" | "review" | "done";
export type Task = { id: string; text: string; done: boolean };
export type Note = {
  id: string; boardId: string; title: string; body: string; color: NoteColor;
  status: NoteStatus; tasks: Task[]; x: number; y: number; layer: number;
  archivedAt: number | null; createdAt: number; updatedAt: number;
};
export type Board = { id: string; name: string; createdAt: number };
export type TackboardData = { version: 1; boards: Board[]; notes: Note[]; activeBoardId: string };
export const STORE_KEY = "archeon:tackboard:v1";
export const COLORS: NoteColor[] = ["butter", "mint", "lilac", "rose", "sky", "paper"];
export const STATUSES: { id: NoteStatus; label: string }[] = [
  { id: "planned", label: "Planned" }, { id: "active", label: "In progress" },
  { id: "review", label: "Review" }, { id: "done", label: "Done" },
];
export const freshId = () => crypto.randomUUID();
export const makeBoard = (name: string): Board => ({ id: freshId(), name: name.trim().slice(0, 58), createdAt: Date.now() });
export function makeNote(boardId: string, count = 0): Note {
  const now = Date.now();
  return { id: freshId(), boardId, title: "Untitled note", body: "", color: COLORS[count % COLORS.length], status: "planned", tasks: [],
    x: 26 + (count % 4) * 272, y: 28 + Math.floor(count / 4) * 312, layer: count + 1,
    archivedAt: null, createdAt: now, updatedAt: now };
}
export function initialData(): TackboardData {
  const board = makeBoard("My first board");
  const first = makeNote(board.id, 0);
  first.title = "Make something good";
  first.color = "butter";
  first.status = "active";
  first.tasks = [
    { id: freshId(), text: "Collect a few ideas", done: true },
    { id: freshId(), text: "Turn one into a plan", done: false },
    { id: freshId(), text: "Celebrate the little wins", done: false },
  ];
  const second = makeNote(board.id, 1);
  second.title = "Little reminders";
  second.body = "A quiet place for what matters today. Double-click any note to edit it.";
  second.color = "mint";
  const third = makeNote(board.id, 2);
  third.title = "Next up";
  third.status = "planned";
  third.color = "lilac";
  third.tasks = [{ id: freshId(), text: "Add your own sticky note", done: false }];
  return { version: 1, boards: [board], notes: [first, second, third], activeBoardId: board.id };
}
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const safeText = (v: unknown, max: number) => isString(v) ? v.slice(0, max) : "";
/** Reject malformed, unbounded or foreign localStorage values instead of crashing rendering. */
export function readStore(value: string | null): TackboardData | null {
  if (!value || value.length > 1_500_000) return null;
  try {
    const raw: unknown = JSON.parse(value);
    if (!raw || typeof raw !== "object") return null;
    const data = raw as Partial<TackboardData>;
    if (data.version !== 1 || !Array.isArray(data.boards) || !Array.isArray(data.notes) || data.boards.length > 100 || data.notes.length > 3000) return null;
    const boards: Board[] = data.boards.filter((item): item is Board => !!item && isString(item.id) && isString(item.name) && isNumber(item.createdAt))
      .map(item => ({ id: item.id.slice(0, 90), name: item.name.slice(0, 58), createdAt: item.createdAt }));
    if (!boards.length) return null;
    const boardIds = new Set(boards.map(board => board.id));
    const notes: Note[] = data.notes.filter((item): item is Note => !!item && isString(item.id) && isString(item.boardId) && boardIds.has(item.boardId))
      .map(item => ({
        id: item.id.slice(0, 90), boardId: item.boardId, title: safeText(item.title, 90), body: safeText(item.body, 1200),
        color: COLORS.includes(item.color) ? item.color : "butter",
        status: STATUSES.some(s => s.id === item.status) ? item.status : "planned",
        tasks: Array.isArray(item.tasks) ? item.tasks.filter((t): t is Task => !!t && isString(t.id) && isString(t.text) && typeof t.done === "boolean")
          .slice(0, 35).map(t => ({ id: t.id.slice(0, 90), text: t.text.slice(0, 180), done: t.done })) : [],
        x: isNumber(item.x) ? Math.max(0, Math.min(7000, item.x)) : 0,
        y: isNumber(item.y) ? Math.max(0, Math.min(7000, item.y)) : 0,
        layer: isNumber(item.layer) ? Math.max(0, Math.min(100000, item.layer)) : 0,
        archivedAt: isNumber(item.archivedAt) ? item.archivedAt : null,
        createdAt: isNumber(item.createdAt) ? item.createdAt : Date.now(),
        updatedAt: isNumber(item.updatedAt) ? item.updatedAt : Date.now(),
      }));
    return { version: 1, boards, notes, activeBoardId: boards.some(b => b.id === data.activeBoardId) ? String(data.activeBoardId) : boards[0].id };
  } catch { return null; }
}
export function allTasksComplete(note: Note): boolean { return note.tasks.length > 0 && note.tasks.every(task => task.done); }
export function progress(note: Note) { return { done: note.tasks.filter(task => task.done).length, total: note.tasks.length }; }
