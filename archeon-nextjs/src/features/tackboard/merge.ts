import type { Board, Note, Task, TackboardData } from "./model";

/** Three-way, field-level merge for independent changes from the desktop and web.
 * If both devices edit the SAME field (or one deletes an item the other edits),
 * report an actual conflict rather than silently discarding either edit.
 */
export type MergeResult = { data: TackboardData; conflicts: string[] };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function mergeItem<T extends { id: string }>(
  base: T | undefined, local: T | undefined, remote: T | undefined,
  fields: readonly (keyof T)[], label: string, conflicts: string[],
): T | undefined {
  if (equal(local, remote)) return local;
  if (equal(local, base)) return remote;
  if (equal(remote, base)) return local;
  if (!base || !local || !remote) {
    conflicts.push(label);
    return local;
  }
  const merged = { ...remote };
  for (const field of fields) {
    const before = base[field], onDevice = local[field], onCloud = remote[field];
    if (equal(onDevice, onCloud) || equal(onDevice, before)) continue;
    if (equal(onCloud, before)) merged[field] = onDevice;
    else conflicts.push(`${label}.${String(field)}`);
  }
  return merged;
}

function mergeCollection<T extends { id: string }>(
  base: readonly T[], local: readonly T[], remote: readonly T[],
  fields: readonly (keyof T)[], label: string, conflicts: string[],
): T[] {
  const old = new Map(base.map(item => [item.id, item]));
  const mine = new Map(local.map(item => [item.id, item]));
  const theirs = new Map(remote.map(item => [item.id, item]));
  // Preserve cloud ordering, append device-only additions.
  const ids = [...new Set([...remote.map(item => item.id), ...local.map(item => item.id), ...base.map(item => item.id)])];
  return ids.flatMap(id => {
    const item = mergeItem(old.get(id), mine.get(id), theirs.get(id), fields, `${label}:${id}`, conflicts);
    return item ? [item] : [];
  });
}

export function mergeTackDocuments(base: TackboardData, local: TackboardData, remote: TackboardData): MergeResult {
  const conflicts: string[] = [];
  const boards = mergeCollection<Board>(base.boards, local.boards, remote.boards, ["name", "createdAt"], "board", conflicts);
  const notes = mergeCollection<Note>(base.notes, local.notes, remote.notes,
    ["boardId", "title", "body", "color", "status", "x", "y", "layer", "archivedAt", "createdAt"],
    "note", conflicts);
  const oldNotes = new Map(base.notes.map(note => [note.id, note]));
  const localNotes = new Map(local.notes.map(note => [note.id, note]));
  const remoteNotes = new Map(remote.notes.map(note => [note.id, note]));
  const safeNotes = notes.map(note => ({ ...note }));
  for (const note of safeNotes) {
    const previous = oldNotes.get(note.id);
    const mine = localNotes.get(note.id);
    const theirs = remoteNotes.get(note.id);
    if (previous && mine && theirs) {
      // Two checkboxes in different tasks are independent edits; merge them separately.
      note.tasks = mergeCollection<Task>(previous.tasks, mine.tasks, theirs.tasks,
        ["text", "done"], `note:${note.id}.task`, conflicts);
    }
    // updatedAt records metadata only; independent edits should not conflict on a timestamp.
    note.updatedAt = Math.max(previous?.updatedAt ?? 0, mine?.updatedAt ?? 0, theirs?.updatedAt ?? 0);
  }
  const boardIds = new Set(boards.map(board => board.id));
  const validNotes = safeNotes.filter(note => boardIds.has(note.boardId));
  if (validNotes.length !== safeNotes.length) conflicts.push("note-on-deleted-board");
  const preferredBoard = local.activeBoardId !== base.activeBoardId ? local.activeBoardId : remote.activeBoardId;
  const activeBoardId = boardIds.has(preferredBoard) ? preferredBoard : boards[0]?.id ?? "";
  return { data: { version: 1, boards, notes: validNotes, activeBoardId }, conflicts };
}
