import { describe, expect, it } from 'vitest';
import { emptyPlayer, friendRole, isPlayerComplete, royalName } from './players';

describe('royalName', () => {
  it('maps the chosen role to the player and the other role to the friend', () => {
    const gus = { ...emptyPlayer('w'), myName: 'Gus', myRole: 'queen' as const, friendName: 'Goldie' };
    expect(royalName(gus, 'queen')).toBe('Gus');
    expect(royalName(gus, 'king')).toBe('Goldie');
    expect(friendRole(gus)).toBe('king');

    const goldie = { ...emptyPlayer('b'), myName: 'Goldie', myRole: 'king' as const, friendName: 'Gus' };
    expect(royalName(goldie, 'king')).toBe('Goldie');
    expect(royalName(goldie, 'queen')).toBe('Gus');
    expect(friendRole(goldie)).toBe('queen');
  });
});

describe('isPlayerComplete', () => {
  it('requires both names', () => {
    const p = emptyPlayer('w');
    expect(isPlayerComplete(p)).toBe(false);
    expect(isPlayerComplete({ ...p, myName: 'Gus' })).toBe(false);
    expect(isPlayerComplete({ ...p, myName: 'Gus', friendName: 'Goldie' })).toBe(true);
    expect(isPlayerComplete({ ...p, myName: '  ', friendName: 'Goldie' })).toBe(false);
  });
});
