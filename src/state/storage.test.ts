import { beforeEach, describe, expect, it } from 'vitest';
import { emptyPlayer, type GameSetup } from './players';
import { clearState, loadState, saveState } from './storage';

const setup: GameSetup = {
  w: { ...emptyPlayer('w'), myName: 'Gus', friendName: 'Goldie' },
  b: { ...emptyPlayer('b'), myName: 'Goldie', friendName: 'Gus' },
};

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips saved state', () => {
    saveState({ setup, pgn: '1. e4 e5', inGame: true });
    const loaded = loadState();
    expect(loaded?.setup.w.myName).toBe('Gus');
    expect(loaded?.pgn).toBe('1. e4 e5');
    expect(loaded?.inGame).toBe(true);
  });

  it('returns null when empty or corrupt', () => {
    expect(loadState()).toBeNull();
    localStorage.setItem('royal-us-state-v1', '{not json');
    expect(loadState()).toBeNull();
    localStorage.setItem('royal-us-state-v1', '{"setup":{}}');
    expect(loadState()).toBeNull();
  });

  it('clears state', () => {
    saveState({ setup, pgn: '', inGame: false });
    clearState();
    expect(loadState()).toBeNull();
  });
});
