import { useState } from 'react';
import type { Color } from '../engine/game';
import {
  emptyPlayer,
  friendRole,
  isPlayerComplete,
  royalName,
  type GameSetup,
  type PlayerConfig,
  type Role,
} from '../state/players';
import AvatarStudio from './AvatarStudio';

interface SetupWizardProps {
  onComplete: (setup: GameSetup) => void;
  /** Prefill (e.g. "play again with same players"). */
  initial?: GameSetup | null;
}

const COLOR_LABEL: Record<Color, string> = { w: 'White', b: 'Black' };
const ROLE_GLYPH: Record<Role, string> = { king: '♚', queen: '♛' };

export default function SetupWizard({ onComplete, initial }: SetupWizardProps) {
  const [step, setStep] = useState<Color>('w');
  const [players, setPlayers] = useState<{ w: PlayerConfig; b: PlayerConfig }>({
    w: initial?.w ?? emptyPlayer('w'),
    b: initial?.b ?? emptyPlayer('b'),
  });
  const [studioFor, setStudioFor] = useState<Role | null>(null);

  const player = players[step];

  function update(patch: Partial<PlayerConfig>) {
    setPlayers((prev) => ({ ...prev, [step]: { ...prev[step], ...patch } }));
  }

  function setAvatar(role: Role, url: string) {
    update({ avatars: { ...player.avatars, [role]: url } });
  }

  function next() {
    if (step === 'w') {
      setStep('b');
    } else {
      onComplete(players);
    }
  }

  return (
    <div className="setup-wizard">
      <div className="wizard-progress">
        <span className={step === 'w' ? 'active' : 'done'}>1 · White army</span>
        <span className={step === 'b' ? 'active' : ''}>2 · Black army</span>
      </div>

      <div className="wizard-card">
        <h2>
          {COLOR_LABEL[step]} army — who's at the keyboard?
          {step === 'b' && <span className="pass-note"> (pass the computer over!)</span>}
        </h2>

        <label className="field">
          Your name
          <input
            type="text"
            value={player.myName}
            placeholder="e.g. Gus"
            onChange={(e) => update({ myName: e.target.value })}
            autoFocus
          />
        </label>

        <div className="field">
          I am the…
          <div className="role-picker">
            {(['king', 'queen'] as Role[]).map((role) => (
              <button
                key={role}
                className={`role-option ${player.myRole === role ? 'chosen' : ''}`}
                onClick={() => update({ myRole: role })}
              >
                <span className="role-glyph">{ROLE_GLYPH[role]}</span>
                {role === 'king' ? 'King' : 'Queen'}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          And my {friendRole(player)} is my friend…
          <input
            type="text"
            value={player.friendName}
            placeholder="e.g. Goldie"
            onChange={(e) => update({ friendName: e.target.value })}
          />
        </label>

        <div className="field">
          Faces of the realm <span className="optional">(optional — glyphs used otherwise)</span>
          <div className="avatar-slots">
            {(['king', 'queen'] as Role[]).map((role) => {
              const name = royalName(player, role).trim() || (role === 'king' ? 'King' : 'Queen');
              const url = player.avatars[role];
              return (
                <button key={role} className="avatar-slot" onClick={() => setStudioFor(role)}>
                  {url ? (
                    <img src={url} alt={`${name} avatar`} />
                  ) : (
                    <span className="avatar-slot-empty">{ROLE_GLYPH[role]}</span>
                  )}
                  <span className="avatar-slot-label">
                    {name}
                    {role === player.myRole ? ' (you)' : ''}
                  </span>
                  <span className="avatar-slot-cta">{url ? 'Change photo' : 'Add photo'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="wizard-actions">
          {step === 'b' && (
            <button className="btn btn-quiet" onClick={() => setStep('w')}>
              ← Back to White
            </button>
          )}
          <button className="btn btn-primary" disabled={!isPlayerComplete(player)} onClick={next}>
            {step === 'w' ? 'Next: Black army →' : '⚔ Begin the battle'}
          </button>
        </div>
      </div>

      {studioFor && (
        <AvatarStudio
          title={`Photo for ${royalName(player, studioFor).trim() || COLOR_LABEL[step]} — the ${
            studioFor === 'king' ? 'King' : 'Queen'
          }`}
          onDone={(url) => {
            setAvatar(studioFor, url);
            setStudioFor(null);
          }}
          onCancel={() => setStudioFor(null)}
        />
      )}
    </div>
  );
}
