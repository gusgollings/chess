import type { Color } from '../engine/game';

export type Role = 'king' | 'queen';

export interface PlayerConfig {
  color: Color;
  /** The player at the keyboard for this army. */
  myName: string;
  /** Which royal piece is "me". */
  myRole: Role;
  /** The friend embodied by the other royal piece. */
  friendName: string;
  /** Cartoonified avatar data URLs, per royal piece. */
  avatars: {
    king: string | null;
    queen: string | null;
  };
}

export interface GameSetup {
  w: PlayerConfig;
  b: PlayerConfig;
}

export function emptyPlayer(color: Color): PlayerConfig {
  return {
    color,
    myName: '',
    myRole: 'king',
    friendName: '',
    avatars: { king: null, queen: null },
  };
}

/** The human name attached to a royal piece of this army. */
export function royalName(player: PlayerConfig, role: Role): string {
  return role === player.myRole ? player.myName : player.friendName;
}

/** The role the player's friend occupies. */
export function friendRole(player: PlayerConfig): Role {
  return player.myRole === 'king' ? 'queen' : 'king';
}

export function isPlayerComplete(player: PlayerConfig): boolean {
  return player.myName.trim().length > 0 && player.friendName.trim().length > 0;
}
