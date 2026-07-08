import type { BoardGrid, LegalTarget, Square } from '../engine/game';
import { FILES, squareAt } from '../engine/game';
import Piece, { type RoyalAvatar } from './Piece';

interface BoardProps {
  grid: BoardGrid;
  selected: Square | null;
  targets: LegalTarget[];
  lastMove: { from: Square; to: Square } | null;
  /** Square of the king currently in check, if any. */
  checkSquare: Square | null;
  /** True renders from black's point of view (rank 1 at top). */
  flipped: boolean;
  onSquareClick: (square: Square) => void;
  /** Resolve an avatar for a royal piece on a square, if configured. */
  avatarFor?: (piece: { type: string; color: string }) => RoyalAvatar | null;
}

export default function Board({
  grid,
  selected,
  targets,
  lastMove,
  checkSquare,
  flipped,
  onSquareClick,
  avatarFor,
}: BoardProps) {
  const rows = [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = [0, 1, 2, 3, 4, 5, 6, 7];
  const orderedRows = flipped ? [...rows].reverse() : rows;
  const orderedCols = flipped ? [...cols].reverse() : cols;
  const targetMap = new Map(targets.map((t) => [t.to, t]));

  return (
    <div className="board" role="grid" aria-label="chess board">
      {orderedRows.map((r) => (
        <div className="board-row" role="row" key={r}>
          {orderedCols.map((c) => {
            const square = squareAt(r, c);
            const piece = grid[r][c];
            const target = targetMap.get(square);
            const classes = ['square', (r + c) % 2 === 0 ? 'light' : 'dark'];
            if (selected === square) classes.push('selected');
            if (lastMove && (lastMove.from === square || lastMove.to === square))
              classes.push('last-move');
            if (checkSquare === square) classes.push('in-check');
            return (
              <button
                key={square}
                role="gridcell"
                className={classes.join(' ')}
                onClick={() => onSquareClick(square)}
                aria-label={square + (piece ? ` ${piece.color}${piece.type}` : '')}
              >
                {piece && <Piece piece={piece} avatar={avatarFor?.(piece) ?? null} />}
                {target && <span className={target.isCapture ? 'hint-capture' : 'hint-move'} />}
                {c === orderedCols[0] && <span className="coord rank">{8 - r}</span>}
                {r === orderedRows[7] && <span className="coord file">{FILES[c]}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
