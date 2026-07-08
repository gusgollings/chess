import type { GameSetup } from './players';

const KEY = 'royal-us-state-v1';

export interface SavedState {
  setup: GameSetup;
  /** PGN of the game in progress; empty string for a fresh board. */
  pgn: string;
  inGame: boolean;
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full (avatars are data URLs) or unavailable — the game still
    // works, it just won't survive a refresh.
  }
}

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    if (!parsed.setup?.w || !parsed.setup?.b) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
