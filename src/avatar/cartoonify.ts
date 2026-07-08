/**
 * Cartoonify pipeline: turns a photo into a flat-shaded "cartoon" avatar.
 *
 * The pixel maths (blur, posterise, edge detection) are pure functions over
 * plain buffers so they can be unit-tested without a real canvas; the
 * `cartoonify` entry point wires them to the Canvas API.
 */

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export const AVATAR_SIZE = 256;

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Separable box blur; radius in pixels. Alpha is preserved. */
export function boxBlur(src: Pixels, radius: number): Pixels {
  if (radius <= 0) return { ...src, data: new Uint8ClampedArray(src.data) };
  const { width, height } = src;
  const tmp = new Float32Array(src.data.length);
  const out = new Uint8ClampedArray(src.data.length);
  const win = radius * 2 + 1;

  // Horizontal pass: src -> tmp
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let k = -radius; k <= radius; k++) {
        const xx = Math.min(width - 1, Math.max(0, x + k));
        const i = (y * width + xx) * 4;
        r += src.data[i];
        g += src.data[i + 1];
        b += src.data[i + 2];
      }
      const o = (y * width + x) * 4;
      tmp[o] = r / win;
      tmp[o + 1] = g / win;
      tmp[o + 2] = b / win;
      tmp[o + 3] = src.data[o + 3];
    }
  }

  // Vertical pass: tmp -> out
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.min(height - 1, Math.max(0, y + k));
        const i = (yy * width + x) * 4;
        r += tmp[i];
        g += tmp[i + 1];
        b += tmp[i + 2];
      }
      const o = (y * width + x) * 4;
      out[o] = clamp255(r / win);
      out[o + 1] = clamp255(g / win);
      out[o + 2] = clamp255(b / win);
      out[o + 3] = tmp[o + 3];
    }
  }
  return { data: out, width, height };
}

/**
 * Quantise each channel to `levels` values after boosting saturation —
 * this produces the flat cel-shaded look.
 */
export function posterize(src: Pixels, levels: number, satBoost = 1.3): Pixels {
  const out = new Uint8ClampedArray(src.data.length);
  const step = 255 / (levels - 1);
  for (let i = 0; i < src.data.length; i += 4) {
    const r = src.data[i];
    const g = src.data[i + 1];
    const b = src.data[i + 2];
    const lum = luminance(r, g, b);
    for (let c = 0; c < 3; c++) {
      const boosted = clamp255(lum + (src.data[i + c] - lum) * satBoost);
      out[i + c] = clamp255(Math.round(boosted / step) * step);
    }
    out[i + 3] = src.data[i + 3];
  }
  return { data: out, width: src.width, height: src.height };
}

/**
 * Sobel edge strength per pixel, 0..1. `low`/`high` are luminance-gradient
 * thresholds for a smooth ramp (soft ink lines, not binary speckle).
 */
export function sobelEdgeMask(src: Pixels, low = 40, high = 120): Float32Array {
  const { width, height } = src;
  const lum = new Float32Array(width * height);
  for (let i = 0, p = 0; i < src.data.length; i += 4, p++) {
    lum[p] = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
  }
  const mask = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      const gx =
        -lum[p - width - 1] - 2 * lum[p - 1] - lum[p + width - 1] +
        lum[p - width + 1] + 2 * lum[p + 1] + lum[p + width + 1];
      const gy =
        -lum[p - width - 1] - 2 * lum[p - width] - lum[p - width + 1] +
        lum[p + width - 1] + 2 * lum[p + width] + lum[p + width + 1];
      const mag = Math.sqrt(gx * gx + gy * gy);
      mask[p] = mag <= low ? 0 : mag >= high ? 1 : (mag - low) / (high - low);
    }
  }
  return mask;
}

/** Darken pixels where the edge mask is strong: the cartoon "ink" lines. */
export function applyInkLines(src: Pixels, mask: Float32Array, strength = 0.8): Pixels {
  const out = new Uint8ClampedArray(src.data);
  for (let p = 0; p < mask.length; p++) {
    const m = mask[p] * strength;
    if (m > 0) {
      const i = p * 4;
      out[i] = out[i] * (1 - m);
      out[i + 1] = out[i + 1] * (1 - m);
      out[i + 2] = out[i + 2] * (1 - m);
    }
  }
  return { data: out, width: src.width, height: src.height };
}

/** Full pure pipeline: blur -> edge mask (from the smoothed photo) -> posterise -> ink. */
export function cartoonifyPixels(src: Pixels): Pixels {
  const smooth = boxBlur(src, 2);
  const edges = sobelEdgeMask(smooth);
  const flat = posterize(smooth, 6);
  return applyInkLines(flat, edges);
}

export interface CropView {
  /** Top-left of the crop square in source-image pixels. */
  sx: number;
  sy: number;
  /** Side length of the crop square in source-image pixels. */
  size: number;
}

/**
 * Render `source` cropped to `view`, cartoonify it, and return a PNG data
 * URL of a circular avatar.
 */
export function cartoonify(
  source: CanvasImageSource,
  view: CropView,
  size: number = AVATAR_SIZE,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(source, view.sx, view.sy, view.size, view.size, 0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const toon = cartoonifyPixels({ data: img.data, width: size, height: size });
  img.data.set(toon.data);
  ctx.putImageData(img, 0, 0);

  // Circular mask.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  return canvas.toDataURL('image/png');
}
