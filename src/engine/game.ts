import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';

export type { Color, PieceSymbol, Square };

export interface BoardPiece {
  type: PieceSymbol;
  color: Color;
}

/** 8x8 grid, row 0 = rank 8 (top, black's home), col 0 = file a. */
export type BoardGrid = (BoardPiece | null)[][];

export interface LegalTarget {
  to: Square;
  isCapture: boolean;
  isPromotion: boolean;
}

export interface MoveResult {
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  captured: PieceSymbol | null;
  san: string;
}

export interface GameStatus {
  turn: Color;
  inCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  /** Set only on checkmate. */
  winner: Color | null;
}

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export function squareAt(row: number, col: number): Square {
  return `${FILES[col]}${8 - row}` as Square;
}

/**
 * Thin adapter over chess.js exposing exactly what the UI needs.
 * All chess rules (castling, en passant, promotion legality, check,
 * checkmate, stalemate, draws) are delegated to chess.js.
 */
export class Game {
  private chess: Chess;

  constructor(pgn?: string) {
    this.chess = new Chess();
    if (pgn) this.chess.loadPgn(pgn);
  }

  board(): BoardGrid {
    return this.chess
      .board()
      .map((row) => row.map((sq) => (sq ? { type: sq.type, color: sq.color } : null)));
  }

  pieceAt(square: Square): BoardPiece | null {
    const p = this.chess.get(square);
    return p ? { type: p.type, color: p.color } : null;
  }

  legalTargets(from: Square): LegalTarget[] {
    return this.chess.moves({ square: from, verbose: true }).map((m) => ({
      to: m.to,
      isCapture: m.isCapture() || m.isEnPassant(),
      isPromotion: m.isPromotion(),
    }));
  }

  /**
   * Attempt a move. Returns the result, or null if illegal.
   * `promotion` is required only when the move is a pawn promotion.
   */
  move(from: Square, to: Square, promotion?: PieceSymbol): MoveResult | null {
    try {
      const m = this.chess.move({ from, to, promotion });
      return {
        from: m.from,
        to: m.to,
        piece: m.piece,
        color: m.color,
        captured: m.captured ?? null,
        san: m.san,
      };
    } catch {
      return null;
    }
  }

  status(): GameStatus {
    const isCheckmate = this.chess.isCheckmate();
    return {
      turn: this.chess.turn(),
      inCheck: this.chess.inCheck(),
      isCheckmate,
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw(),
      isGameOver: this.chess.isGameOver(),
      winner: isCheckmate ? (this.chess.turn() === 'w' ? 'b' : 'w') : null,
    };
  }

  /** Pieces each color has LOST, in capture order. */
  captured(): { w: PieceSymbol[]; b: PieceSymbol[] } {
    const lost: { w: PieceSymbol[]; b: PieceSymbol[] } = { w: [], b: [] };
    for (const m of this.chess.history({ verbose: true })) {
      if (m.captured) lost[m.color === 'w' ? 'b' : 'w'].push(m.captured);
    }
    return lost;
  }

  lastMove(): MoveResult | null {
    const h = this.chess.history({ verbose: true });
    const m = h[h.length - 1];
    if (!m) return null;
    return {
      from: m.from,
      to: m.to,
      piece: m.piece,
      color: m.color,
      captured: m.captured ?? null,
      san: m.san,
    };
  }

  /** Square of the given color's king (for the in-check highlight). */
  kingSquare(color: Color): Square {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (sq && sq.type === 'k' && sq.color === color) return sq.square;
      }
    }
    throw new Error(`no ${color} king on board`);
  }

  pgn(): string {
    return this.chess.pgn();
  }

  reset(): void {
    this.chess.reset();
  }
}
