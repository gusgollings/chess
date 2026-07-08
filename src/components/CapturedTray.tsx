import type { Color, PieceSymbol } from '../engine/game';
import { capturedRoyalName } from '../state/messages';
import type { GameSetup } from '../state/players';
import Piece from './Piece';

interface CapturedTrayProps {
  setup: GameSetup | null;
  /** Pieces each color has lost, in capture order. */
  captured: { w: PieceSymbol[]; b: PieceSymbol[] };
  color: Color;
}

/** The fallen of one army. Captured queens with avatars show their face. */
export default function CapturedTray({ setup, captured, color }: CapturedTrayProps) {
  const lost = captured[color];
  return (
    <div className={`captured-tray tray-${color}`} aria-label={`pieces lost by ${color}`}>
      {lost.length === 0 && <span className="tray-empty">No losses</span>}
      {lost.map((type, i) => {
        const name = capturedRoyalName(setup, color, type);
        const avatarUrl = type === 'q' ? setup?.[color].avatars.queen : null;
        return (
          <span key={i} className={`captured-piece ${name ? 'captured-royal' : ''}`}>
            <Piece
              piece={{ type, color }}
              avatar={name && avatarUrl ? { url: avatarUrl, name } : null}
            />
            {name && <span className="captured-name">{name}</span>}
          </span>
        );
      })}
    </div>
  );
}
