import type { Color, PieceSymbol } from '../engine/game';
import Piece from './Piece';

const CHOICES: PieceSymbol[] = ['q', 'r', 'b', 'n'];

interface PromotionDialogProps {
  color: Color;
  onChoose: (piece: PieceSymbol) => void;
  onCancel: () => void;
}

export default function PromotionDialog({ color, onChoose, onCancel }: PromotionDialogProps) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal promotion" onClick={(e) => e.stopPropagation()}>
        <h3>Promote to…</h3>
        <div className="promotion-choices">
          {CHOICES.map((type) => (
            <button key={type} onClick={() => onChoose(type)} aria-label={`promote to ${type}`}>
              <Piece piece={{ type, color }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
