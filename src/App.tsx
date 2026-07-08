import { useState } from 'react';
import GameScreen from './components/GameScreen';
import SetupWizard from './components/SetupWizard';
import type { GameSetup } from './state/players';

export default function App() {
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [inGame, setInGame] = useState(false);

  return (
    <main className="app-shell">
      <h1>Royal Us</h1>
      {inGame && setup ? (
        <GameScreen setup={setup} />
      ) : (
        <>
          <p className="tagline">
            Ordinary chess — except the King and Queen are <em>you and your friend</em>. Protect
            yourselves.
          </p>
          <SetupWizard
            initial={setup}
            onComplete={(s) => {
              setSetup(s);
              setInGame(true);
            }}
          />
        </>
      )}
    </main>
  );
}
