import { describe, expect, it } from 'vitest';
import {
  applyInkLines,
  boxBlur,
  cartoonifyPixels,
  posterize,
  sobelEdgeMask,
  type Pixels,
} from './cartoonify';

function solid(width: number, height: number, [r, g, b]: number[]): Pixels {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return { data, width, height };
}

/** Left half dark, right half light — a hard vertical edge down the middle. */
function stepImage(size = 16): Pixels {
  const px = solid(size, size, [30, 30, 30]);
  for (let y = 0; y < size; y++) {
    for (let x = size / 2; x < size; x++) {
      const i = (y * size + x) * 4;
      px.data[i] = px.data[i + 1] = px.data[i + 2] = 220;
    }
  }
  return px;
}

describe('boxBlur', () => {
  it('leaves a uniform image unchanged', () => {
    const px = solid(8, 8, [100, 150, 200]);
    const out = boxBlur(px, 2);
    expect(Array.from(out.data)).toEqual(Array.from(px.data));
  });

  it('smooths a hard edge into intermediate values', () => {
    const out = boxBlur(stepImage(), 2);
    // Sample next to the edge boundary on a middle row.
    const i = (8 * 16 + 7) * 4;
    expect(out.data[i]).toBeGreaterThan(30);
    expect(out.data[i]).toBeLessThan(220);
  });

  it('preserves alpha', () => {
    const out = boxBlur(stepImage(), 3);
    for (let i = 3; i < out.data.length; i += 4) expect(out.data[i]).toBe(255);
  });
});

describe('posterize', () => {
  it('limits each channel to the requested number of levels', () => {
    // A gradient with many distinct values.
    const size = 16;
    const px = solid(size, size, [0, 0, 0]);
    for (let p = 0; p < size * size; p++) {
      const v = Math.floor((p / (size * size)) * 255);
      px.data[p * 4] = px.data[p * 4 + 1] = px.data[p * 4 + 2] = v;
    }
    const levels = 6;
    const out = posterize(px, levels, 1); // no saturation boost for greys
    const distinct = new Set<number>();
    for (let i = 0; i < out.data.length; i += 4) distinct.add(out.data[i]);
    expect(distinct.size).toBeLessThanOrEqual(levels);
  });

  it('boosts saturation away from grey', () => {
    const px = solid(4, 4, [180, 100, 100]); // reddish
    const out = posterize(px, 32, 1.5);
    // Red channel pushed further above luminance, blue/green further below.
    expect(out.data[0]).toBeGreaterThanOrEqual(180);
    expect(out.data[2]).toBeLessThanOrEqual(100);
  });
});

describe('sobelEdgeMask', () => {
  it('is zero everywhere on a uniform image', () => {
    const mask = sobelEdgeMask(solid(16, 16, [90, 90, 90]));
    expect(Math.max(...mask)).toBe(0);
  });

  it('fires along a hard edge and not in flat regions', () => {
    const mask = sobelEdgeMask(stepImage());
    const mid = 8 * 16 + 8; // on the boundary column
    const flat = 8 * 16 + 2; // deep in the dark half
    expect(mask[mid]).toBeGreaterThan(0.5);
    expect(mask[flat]).toBe(0);
  });
});

describe('applyInkLines', () => {
  it('darkens only masked pixels', () => {
    const px = solid(4, 4, [200, 200, 200]);
    const mask = new Float32Array(16);
    mask[5] = 1;
    const out = applyInkLines(px, mask, 0.8);
    expect(out.data[5 * 4]).toBeLessThan(60);
    expect(out.data[0]).toBe(200);
  });
});

describe('cartoonifyPixels', () => {
  it('returns an image of the same dimensions with valid alpha', () => {
    const out = cartoonifyPixels(stepImage());
    expect(out.width).toBe(16);
    expect(out.height).toBe(16);
    expect(out.data.length).toBe(16 * 16 * 4);
    for (let i = 3; i < out.data.length; i += 4) expect(out.data[i]).toBe(255);
  });
});
