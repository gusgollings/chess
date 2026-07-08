import { useMemo, useRef, useState } from 'react';
import type { Color, LegalTarget, PieceSymbol, Square } from '../engine/game';
import { Game } from '../engine/game';
import {
  captureMessage,
  dangerMessage,
  gameOverMessage,
  turnMessage,
} from '../state/messages';
import { royalName, type GameSetup } from '../state/players';
import Board from './Board';
import CapturedTray from './CapturedTray';
import type { RoyalAvatar } from './Piece';
import PromotionDialog from './PromotionDialog';

interface PendingPromotion {
  from: Square;
  to: Square;
  color: Color;
}

interface GameScreenProps {
  setup: GameSetup | null;
  /** Resume a saved game. */
  initialPgn?: string;
  /** Called after every move (and on restart) so the app can persist. */
  onPgnChange?: (pgn: string) => void;
  /** Back to the setup wizard. */
  onNewPlayers?: () => void;
}

export default function GameScreen({
  setup,
  initialPgn,
  onPgnChange,
  onNewPlayers,
}: GameScreenProps) {
  const gameRef = useRef<Game>();
  if (!gameRef.current) {
    try {
      gameRef.current = new Game(initialPgn || undefined);
    } catch {
      gameRef.current = new Game(); // corrupt saved PGN — start fresh
    }
  }
  const game = gameRef.current;

  const [, setTick] = useState(0);
  const rerender = () => setTick((t) => t + 1);

  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [autoFlip, setAutoFlip] = useState(true);
  const [gameOverDismissed, setGameOverDismissed] = useState(false);

  const status = game.status();
  const grid = game.board();
  const lastMove = game.lastMove();
  const captured = game.captured();
  const targets: LegalTarget[] = useMemo(
    () => (selected ? game.legalTargets(selected) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, lastMove?.san],
  );

  function applyMove(from: Square, to: Square, promotion?: PieceSymbol) {
    if (game.move(from, to, promotion)) {
      setSelected(null);
      setPendingPromotion(null);
      onPgnChange?.(game.pgn());
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
    setGameOverDismissed(false);
    onPgnChange?.('');
    rerender();
  }

  function avatarFor(piece: { type: string; color: string }): RoyalAvatar | null {
    if (!setup || (piece.type !== 'k' && piece.type !== 'q')) return null;
    const player = setup[piece.color as Color];
    const role = piece.type === 'k' ? 'king' : 'queen';
    const url = player.avatars[role];
    return url ? { url, name: royalName(player, role) } : null;
  }

  const overMessage = gameOverMessage(setup, status);
  const banner = overMessage ?? (status.inCheck ? dangerMessage(setup, status.turn) : turnMessage(setup, status.turn));
  const bannerClass =
    'banner' + (overMessage ? ' banner-over' : status.inCheck ? ' banner-danger' : '');
  const griefLine = !overMessage ? captureMessage(setup, lastMove) : null;

  return (
    <div className="game-screen">
      <div className={bannerClass} role="status">
        {banner}
      </div>
      {griefLine && <div className="banner banner-grief">{griefLine}</div>}
      <CapturedTray setup={setup} captured={captured} color="b" />
      <Board
        grid={grid}
        selected={selected}
        targets={targets}
        lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
        checkSquare={status.inCheck ? game.kingSquare(status.turn) : null}
        flipped={autoFlip && status.turn === 'b'}
        onSquareClick={onSquareClick}
        avatarFor={avatarFor}
      />
      <CapturedTray setup={setup} captured={captured} color="w" />
      <div className="game-controls">
        <label className="flip-toggle">
          <input
            type="checkbox"
            checked={autoFlip}
            onChange={(e) => setAutoFlip(e.target.checked)}
          />
          Flip board for Black
        </label>
        <button onClick={restart}>Restart game</button>
        {onNewPlayers && <button onClick={onNewPlayers}>New players</button>}
      </div>
      {pendingPromotion && (
        <PromotionDialog
          color={pendingPromotion.color}
          onChoose={(p) => applyMove(pendingPromotion.from, pendingPromotion.to, p)}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
      {overMessage && !gameOverDismissed && (
        <div className="modal-backdrop">
          <div className="modal game-over">
            <h3>{overMessage}</h3>
            <div className="studio-actions">
              <button className="btn btn-primary" onClick={restart}>
                ⚔ Rematch
              </button>
              {onNewPlayers && (
                <button className="btn" onClick={onNewPlayers}>
                  New players
                </button>
              )}
              <button className="btn btn-quiet" onClick={() => setGameOverDismissed(true)}>
                View board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
