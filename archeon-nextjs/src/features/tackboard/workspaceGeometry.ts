/** Pure, platform-independent pinboard geometry for mouse, pen and touch dragging. */
export type PinboardPoint = { x: number; y: number };
export type PinboardRect = { left: number; right: number; top: number; bottom: number };

export type PinboardNoteBounds = PinboardPoint & { width?: number; height?: number };
export const PINBOARD_INSET = 18;

/** Allow ample empty workspace while accounting for long checklist notes. */
export function workspaceDimensions(notes: readonly PinboardNoteBounds[]): { width: number; height: number } {
  return {
    width: Math.max(1500, ...notes.map(note => Math.max(0, note.x) + (note.width === undefined ? 350 : note.width + 80))),
    height: Math.max(1050, ...notes.map(note => Math.max(0, note.y) + (note.height === undefined ? 380 : note.height + 80))),
  };
}

/** Repair legacy/out-of-bounds positions for display without overwriting cloud data. */
export function clampNotePosition(
  position: PinboardPoint,
  canvas: { width: number; height: number },
  note: { width: number; height: number },
): PinboardPoint {
  const xLimit = Math.max(PINBOARD_INSET, canvas.width - note.width - PINBOARD_INSET);
  const yLimit = Math.max(PINBOARD_INSET, canvas.height - note.height - PINBOARD_INSET);
  const x = Number.isFinite(position.x) ? position.x : PINBOARD_INSET;
  const y = Number.isFinite(position.y) ? position.y : PINBOARD_INSET;
  return {
    x: Math.max(PINBOARD_INSET, Math.min(xLimit, x)),
    y: Math.max(PINBOARD_INSET, Math.min(yLimit, y)),
  };
}

export function edgeScrollVelocity(clientX: number, clientY: number, rect: PinboardRect): PinboardPoint {
  const edge = 58;
  const speed = 13;
  return {
    x: clientX < rect.left + edge ? -speed : clientX > rect.right - edge ? speed : 0,
    y: clientY < rect.top + edge ? -speed : clientY > rect.bottom - edge ? speed : 0,
  };
}

export function draggedNotePosition(input: {
  origin: PinboardPoint;
  pointerStart: PinboardPoint;
  pointerCurrent: PinboardPoint;
  scrollStart: PinboardPoint;
  scrollCurrent: PinboardPoint;
  canvas: { width: number; height: number };
  note: { width: number; height: number };
}): PinboardPoint {
  return clampNotePosition({
    x: input.origin.x + input.pointerCurrent.x - input.pointerStart.x + input.scrollCurrent.x - input.scrollStart.x,
    y: input.origin.y + input.pointerCurrent.y - input.pointerStart.y + input.scrollCurrent.y - input.scrollStart.y,
  }, input.canvas, input.note);
}
