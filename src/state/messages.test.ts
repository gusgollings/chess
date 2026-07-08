import { describe, expect, it } from 'vitest';
import type { GameStatus, MoveResult } from '../engine/game';
import {
  captureMessage,
  capturedRoyalName,
  dangerMessage,
  gameOverMessage,
  turnMessage,
} from './messages';
import { emptyPlayer, type GameSetup } from './players';

// Gus (White) plays as the Queen; his friend Goldie is his King.
// Goldie (Black) plays as the King; her friend Gus is her Queen.
const setup: GameSetup = {
  w: { ...emptyPlayer('w'), myName: 'Gus', myRole: 'queen', friendName: 'Goldie' },
  b: { ...emptyPlayer('b'), myName: 'Goldie', myRole: 'king', friendName: 'Gus' },
};

function status(partial: Partial<GameStatus>): GameStatus {
  return {
    turn: 'w',
    inCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    isGameOver: false,
    winner: null,
    ...partial,
  };
}

describe('turnMessage', () => {
  it('names the player at the keyboard', () => {
    expect(turnMessage(setup, 'w')).toBe('Gus to move (White).');
    expect(turnMessage(null, 'b')).toBe('Black to move.');
  });
});

describe('dangerMessage', () => {
  it("uses the king's human name and addresses the right person", () => {
    // White king is Gus's friend Goldie.
    expect(dangerMessage(setup, 'w')).toBe('⚠ Goldie is in danger! Protect your friend!');
    // Black king is Goldie herself.
    expect(dangerMessage(setup, 'b')).toBe('⚠ Goldie is in danger! Protect yourself!');
    expect(dangerMessage(null, 'w')).toBe('White is in check!');
  });
});

describe('captureMessage', () => {
  const queenTake = (by: 'w' | 'b'): MoveResult => ({
    from: 'd1',
    to: 'd8',
    piece: 'q',
    color: by,
    captured: 'q',
    san: 'Qxd8',
  });

  it('mourns a captured queen by name', () => {
    // White captures Black's queen, who is Goldie's friend Gus.
    expect(captureMessage(setup, queenTake('w'))).toBe(
      '💔 Gus has been captured! Avenge them!',
    );
    // Black captures White's queen — Gus himself.
    expect(captureMessage(setup, queenTake('b'))).toBe(
      '💔 Gus has been captured! Goldie has taken you!',
    );
  });

  it('is silent for non-queen captures and missing setup', () => {
    expect(captureMessage(setup, { ...queenTake('w'), captured: 'p' })).toBeNull();
    expect(captureMessage(setup, { ...queenTake('w'), captured: null })).toBeNull();
    expect(captureMessage(null, queenTake('w'))).toBeNull();
    expect(captureMessage(setup, null)).toBeNull();
  });
});

describe('gameOverMessage', () => {
  it('crowns the winner and mourns the fallen king', () => {
    expect(gameOverMessage(setup, status({ isCheckmate: true, isGameOver: true, winner: 'w' }))).toBe(
      "👑 Checkmate — Gus's army wins! Goldie has fallen.",
    );
    expect(gameOverMessage(setup, status({ isCheckmate: true, isGameOver: true, winner: 'b' }))).toBe(
      "👑 Checkmate — Goldie's army wins! Goldie has fallen.",
    );
  });

  it('handles draws and ongoing games', () => {
    expect(gameOverMessage(setup, status({ isStalemate: true, isDraw: true }))).toMatch(/Stalemate/);
    expect(gameOverMessage(setup, status({ isDraw: true }))).toMatch(/draw/i);
    expect(gameOverMessage(setup, status({}))).toBeNull();
  });
});

describe('capturedRoyalName', () => {
  it('names captured queens only', () => {
    expect(capturedRoyalName(setup, 'w', 'q')).toBe('Gus');
    expect(capturedRoyalName(setup, 'b', 'q')).toBe('Gus');
    expect(capturedRoyalName(setup, 'w', 'r')).toBeNull();
    expect(capturedRoyalName(null, 'w', 'q')).toBeNull();
  });
});
