/** Pure, platform-independent pinboard geometry for mouse, pen and touch dragging. */
export type PinboardPoint = { x: number; y: number };
export type PinboardRect = { left: number; right: number; top: number; bottom: number };

export type PinboardNoteBounds = PinboardPoint & { width?: number; height?: number };
export const PINBOARD_INSET = 18;

/**
 * Fill the entire available editing viewport first. Only grow past that area
 * to contain notes placed farther right or lower down, with a tight margin.
 * The fallback is used only before ResizeObserver measures the viewport.
 */
export const PINBOARD_MARGIN = 36;
export function workspaceDimensions(
  notes: readonly PinboardNoteBounds[],
  viewport: { width: number; height: number } = { width: 0, height: 0 },
): { width: number; height: number } {
  const noteRight = notes.reduce((max, note) => Math.max(max, Math.max(0, Number.isFinite(note.x) ? note.x : 0) + (note.width ?? 247)), 0);
  const noteBottom = notes.reduce((max, note) => Math.max(max, Math.max(0, Number.isFinite(note.y) ? note.y : 0) + (note.height ?? 265)), 0);
  const extra = notes.length ? PINBOARD_MARGIN : 0;
  const visibleWidth = viewport.width > 0 ? viewport.width : 560;
  const visibleHeight = viewport.height > 0 ? viewport.height : 410;
  return {
    width: Math.ceil(Math.max(280, visibleWidth, noteRight + extra)),
    height: Math.ceil(Math.max(300, visibleHeight, noteBottom + extra)),
  };
}

/** Pick an unoccupied spot near the current scroll position, not a distant row. */
export function nextNotePosition(
  notes: readonly PinboardNoteBounds[],
  viewport: { width: number; height: number; scrollLeft: number; scrollTop: number },
): PinboardPoint {
  const cellWidth = 272;
  const cellHeight = 312;
  const originX = Math.max(26, Math.floor(viewport.scrollLeft) + 26);
  const originY = Math.max(28, Math.floor(viewport.scrollTop) + 28);
  const columns = Math.max(1, Math.floor(Math.max(247, viewport.width - 52) / cellWidth));
  for (let index = 0; index < Math.max(32, notes.length + 12); index++) {
    const x = Math.min(7000, originX + (index % columns) * cellWidth);
    const y = Math.min(7000, originY + Math.floor(index / columns) * cellHeight);
    const overlaps = notes.some(note =>
      x < note.x + (note.width ?? 247) + 14 && x + 247 + 14 > note.x &&
      y < note.y + (note.height ?? 265) + 14 && y + 265 + 14 > note.y
    );
    if (!overlaps) return { x, y };
  }
  // A pathological densely packed board can still accept a note beside the current view.
  return { x: Math.min(7000, originX), y: Math.min(7000, originY + (notes.length + 1) * cellHeight) };
}

/** Extend a temporary drag canvas only near the trailing scroll edges. */
export function dragCanvasDimensions(
  canvas: { width: number; height: number },
  viewport: { width: number; height: number; scrollLeft: number; scrollTop: number },
  velocity: PinboardPoint,
): { width: number; height: number } {
  return {
    width: velocity.x > 0 && canvas.width - viewport.scrollLeft - viewport.width < 150
      ? Math.min(7700, canvas.width + 300) : canvas.width,
    height: velocity.y > 0 && canvas.height - viewport.scrollTop - viewport.height < 150
      ? Math.min(7700, canvas.height + 300) : canvas.height,
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
  layoutShift?: PinboardPoint;
}): PinboardPoint {
  return clampNotePosition({
    x: input.origin.x + input.pointerCurrent.x - input.pointerStart.x + input.scrollCurrent.x - input.scrollStart.x + (input.layoutShift?.x ?? 0),
    y: input.origin.y + input.pointerCurrent.y - input.pointerStart.y + input.scrollCurrent.y - input.scrollStart.y + (input.layoutShift?.y ?? 0),
  }, input.canvas, input.note);
}
