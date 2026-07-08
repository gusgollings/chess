import { describe, expect, it } from 'vitest';
import { Game, squareAt } from './game';

describe('squareAt', () => {
  it('maps grid coordinates to algebraic squares', () => {
    expect(squareAt(0, 0)).toBe('a8');
    expect(squareAt(7, 0)).toBe('a1');
    expect(squareAt(7, 7)).toBe('h1');
    expect(squareAt(4, 4)).toBe('e4');
  });
});

describe('Game', () => {
  it('starts with white to move and a full board', () => {
    const g = new Game();
    const s = g.status();
    expect(s.turn).toBe('w');
    expect(s.isGameOver).toBe(false);
    const board = g.board();
    expect(board[0][4]).toEqual({ type: 'k', color: 'b' });
    expect(board[7][3]).toEqual({ type: 'q', color: 'w' });
  });

  it('lists legal targets and rejects illegal moves', () => {
    const g = new Game();
    const targets = g.legalTargets('e2').map((t) => t.to);
    expect(targets.sort()).toEqual(['e3', 'e4']);
    expect(g.move('e2', 'e5')).toBeNull();
    expect(g.move('e2', 'e4')).not.toBeNull();
  });

  it("detects checkmate and the winner (fool's mate)", () => {
    const g = new Game();
    g.move('f2', 'f3');
    g.move('e7', 'e5');
    g.move('g2', 'g4');
    const mate = g.move('d8', 'h4');
    expect(mate?.san).toBe('Qh4#');
    const s = g.status();
    expect(s.isCheckmate).toBe(true);
    expect(s.isGameOver).toBe(true);
    expect(s.winner).toBe('b');
  });

  it('reports check without game over', () => {
    const g = new Game();
    g.move('e2', 'e4');
    g.move('f7', 'f6');
    g.move('d1', 'h5'); // Qh5+
    const s = g.status();
    expect(s.inCheck).toBe(true);
    expect(s.turn).toBe('b');
    expect(s.isGameOver).toBe(false);
  });

  it('flags promotions in legal targets and performs them', () => {
    const g = new Game();
    // March the a-pawn to promotion.
    g.move('a2', 'a4');
    g.move('h7', 'h6');
    g.move('a4', 'a5');
    g.move('h6', 'h5');
    g.move('a5', 'a6');
    g.move('h5', 'h4');
    g.move('a6', 'b7'); // capture into 7th rank
    g.move('h4', 'h3');
    const targets = g.legalTargets('b7');
    expect(targets.some((t) => t.isPromotion)).toBe(true);
    const m = g.move('b7', 'a8', 'q');
    expect(m).not.toBeNull();
    expect(g.pieceAt('a8')).toEqual({ type: 'q', color: 'w' });
  });

  it('tracks captured pieces per side', () => {
    const g = new Game();
    g.move('e2', 'e4');
    g.move('d7', 'd5');
    g.move('e4', 'd5'); // white takes black pawn
    g.move('d8', 'd5'); // black queen takes white pawn
    const lost = g.captured();
    expect(lost.b).toEqual(['p']);
    expect(lost.w).toEqual(['p']);
  });

  it('finds the king square', () => {
    const g = new Game();
    expect(g.kingSquare('w')).toBe('e1');
    g.move('e2', 'e4');
    g.move('e7', 'e5');
    g.move('e1', 'e2');
    expect(g.kingSquare('w')).toBe('e2');
  });

  it('round-trips state through PGN', () => {
    const g = new Game();
    g.move('e2', 'e4');
    g.move('c7', 'c5');
    const copy = new Game(g.pgn());
    expect(copy.status().turn).toBe('w');
    expect(copy.pieceAt('c5')).toEqual({ type: 'p', color: 'b' });
    expect(copy.lastMove()?.san).toBe('c5');
  });
});
