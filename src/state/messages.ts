import type { Color, PieceSymbol } from '../engine/game';
import type { GameStatus, MoveResult } from '../engine/game';
import { royalName, type GameSetup } from './players';

const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

export function armyName(setup: GameSetup | null, color: Color): string {
  return setup ? `${setup[color].myName}'s army` : COLOR_NAME[color];
}

export function turnMessage(setup: GameSetup | null, color: Color): string {
  return setup
    ? `${setup[color].myName} to move (${COLOR_NAME[color]}).`
    : `${COLOR_NAME[color]} to move.`;
}

/** The check alert: the king of `color` is under attack. */
export function dangerMessage(setup: GameSetup | null, color: Color): string {
  if (!setup) return `${COLOR_NAME[color]} is in check!`;
  const player = setup[color];
  const kingName = royalName(player, 'king');
  const suffix = player.myRole === 'king' ? ' Protect yourself!' : ` Protect your friend!`;
  return `⚠ ${kingName} is in danger!${suffix}`;
}

/**
 * Personalised capture alert for the most recent move, or null when the
 * capture has no face attached (non-royal pieces, or no setup).
 */
export function captureMessage(setup: GameSetup | null, move: MoveResult | null): string | null {
  if (!setup || !move || move.captured !== 'q') return null;
  const victimColor: Color = move.color === 'w' ? 'b' : 'w';
  const player = setup[victimColor];
  const queenName = royalName(player, 'queen');
  const grief = player.myRole === 'queen' ? `${setup[move.color].myName} has taken you!` : 'Avenge them!';
  return `💔 ${queenName} has been captured! ${grief}`;
}

export function gameOverMessage(setup: GameSetup | null, status: GameStatus): string | null {
  if (status.isCheckmate && status.winner) {
    const loser: Color = status.winner === 'w' ? 'b' : 'w';
    if (!setup) return `Checkmate — ${COLOR_NAME[status.winner]} wins!`;
    const fallenKing = royalName(setup[loser], 'king');
    return `👑 Checkmate — ${armyName(setup, status.winner)} wins! ${fallenKing} has fallen.`;
  }
  if (status.isStalemate) return 'Stalemate — nobody falls today. Draw.';
  if (status.isDraw) return 'A draw — both royal houses live to fight again.';
  return null;
}

/** Human name for a royal piece in the captured tray, if it has one. */
export function capturedRoyalName(
  setup: GameSetup | null,
  color: Color,
  piece: PieceSymbol,
): string | null {
  if (!setup || piece !== 'q') return null;
  return royalName(setup[color], 'queen');
}
