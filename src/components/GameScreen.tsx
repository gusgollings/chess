import { useMemo, useRef, useState } from 'react';
import type { Color, LegalTarget, PieceSymbol, Square } from '../engine/game';
import { Game } from '../engine/game';
import { royalName, type GameSetup } from '../state/players';
import Board from './Board';
import type { RoyalAvatar } from './Piece';
import PromotionDialog from './PromotionDialog';

const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

interface PendingPromotion {
  from: Square;
  to: Square;
  color: Color;
}

interface GameScreenProps {
  setup?: GameSetup | null;
}

export default function GameScreen({ setup }: GameScreenProps) {
  const gameRef = useRef<Game>();
  if (!gameRef.current) gameRef.current = new Game();
  const game = gameRef.current;

  const [, setTick] = useState(0);
  const rerender = () => setTick((t) => t + 1);

  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const status = game.status();
  const grid = game.board();
  const lastMove = game.lastMove();
  const targets: LegalTarget[] = useMemo(
    () => (selected ? game.legalTargets(selected) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, lastMove?.san],
  );

  function applyMove(from: Square, to: Square, promotion?: PieceSymbol) {
    if (game.move(from, to, promotion)) {
      setSelected(null);
      setPendingPromotion(null);
      rerender();
    }
  }

  function onSquareClick(square: Square) {
    if (status.isGameOver || pendingPromotion) return;
    if (selected) {
      const target = targets.find((t) => t.to === square);
      if (target) {
        if (target.isPromotion) {
          setPendingPromotion({ from: selected, to: square, color: status.turn });
        } else {
          applyMove(selected, square);
        }
        return;
      }
      if (square === selected) {
        setSelected(null);
        return;
      }
    }
    const piece = game.pieceAt(square);
    setSelected(piece && piece.color === status.turn ? square : null);
  }

  function restart() {
    game.reset();
    setSelected(null);
    setPendingPromotion(null);
    rerender();
  }

  function avatarFor(piece: { type: string; color: string }): RoyalAvatar | null {
    if (!setup || (piece.type !== 'k' && piece.type !== 'q')) return null;
    const player = setup[piece.color as Color];
    const role = piece.type === 'k' ? 'king' : 'queen';
    const url = player.avatars[role];
    return url ? { url, name: royalName(player, role) } : null;
  }

  /** "Gus's army (White)" when configured, plain color name otherwise. */
  function armyName(color: Color): string {
    return setup ? `${setup[color].myName}'s army (${COLOR_NAME[color]})` : COLOR_NAME[color];
  }

  let banner: string;
  let bannerClass = 'banner';
  if (status.isCheckmate) {
    banner = `Checkmate — ${armyName(status.winner!)} wins!`;
    bannerClass += ' banner-over';
  } else if (status.isStalemate) {
    banner = 'Stalemate — draw.';
    bannerClass += ' banner-over';
  } else if (status.isDraw) {
    banner = 'Draw.';
    bannerClass += ' banner-over';
  } else if (status.inCheck) {
    banner = `${armyName(status.turn)} is in check!`;
    bannerClass += ' banner-danger';
  } else {
    banner = `${armyName(status.turn)} to move.`;
  }

  return (
    <div className="game-screen">
      <div className={bannerClass} role="status">
        {banner}
      </div>
      <Board
        grid={grid}
        selected={selected}
        targets={targets}
        lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
        checkSquare={status.inCheck ? game.kingSquare(status.turn) : null}
        flipped={false}
        onSquareClick={onSquareClick}
        avatarFor={avatarFor}
      />
      <div className="game-controls">
        <button onClick={restart}>Restart game</button>
      </div>
      {pendingPromotion && (
        <PromotionDialog
          color={pendingPromotion.color}
          onChoose={(p) => applyMove(pendingPromotion.from, pendingPromotion.to, p)}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </div>
  );
}
