import type { BoardPiece } from '../engine/game';

const GLYPHS: Record<string, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

export interface RoyalAvatar {
  /** Cartoonified image data URL, when the piece is a personalised royal. */
  url: string;
  /** Human name of the person this piece represents. */
  name: string;
}

interface PieceProps {
  piece: BoardPiece;
  avatar?: RoyalAvatar | null;
}

/**
 * Renders a chess piece. Royals (king/queen) with a configured avatar render
 * as a face medallion wearing a small crown; everything else is a glyph.
 */
export default function Piece({ piece, avatar }: PieceProps) {
  if (avatar && (piece.type === 'k' || piece.type === 'q')) {
    return (
      <span className={`piece piece-avatar color-${piece.color}`} title={avatar.name}>
        <span className="avatar-crown" aria-hidden>
          {piece.type === 'k' ? '👑' : '♛'}
        </span>
        <img src={avatar.url} alt={avatar.name} draggable={false} />
      </span>
    );
  }
  return (
    <span className={`piece piece-glyph color-${piece.color}`} aria-hidden draggable={false}>
      {GLYPHS[piece.type]}
    </span>
  );
}
