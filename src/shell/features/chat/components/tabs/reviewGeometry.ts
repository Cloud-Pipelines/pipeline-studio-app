/** A selection rectangle in CSS pixels, relative to the overlay box. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

/**
 * Crops a CSS-pixel selection out of a capture-resolution canvas, returning the
 * cropped region as a PNG blob (or null if the box/2D context is unavailable).
 */
export function cropRegion(
  image: HTMLCanvasElement,
  box: HTMLElement,
  rect: Rect,
): Promise<Blob | null> {
  // Map the CSS-pixel selection onto the capture-resolution canvas.
  const scaleX = image.width / box.clientWidth;
  const scaleY = image.height / box.clientHeight;
  const sx = Math.round(rect.x * scaleX);
  const sy = Math.round(rect.y * scaleY);
  const sw = Math.max(1, Math.round(rect.w * scaleX));
  const sh = Math.max(1, Math.round(rect.h * scaleY));

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const ctx = out.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  return new Promise((resolve) =>
    out.toBlob((blob) => resolve(blob), "image/png"),
  );
}
