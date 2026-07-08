import { useRef, useState } from 'react';
import GameScreen from './components/GameScreen';
import SetupWizard from './components/SetupWizard';
import type { GameSetup } from './state/players';
import { clearState, loadState, saveState } from './state/storage';

export default function App() {
  const savedRef = useRef(loadState());
  const saved = savedRef.current;

  const [setup, setSetup] = useState<GameSetup | null>(saved?.setup ?? null);
  const [inGame, setInGame] = useState(saved?.inGame ?? false);
  const [gameId, setGameId] = useState(0);
  const pgnRef = useRef(saved?.pgn ?? '');

  function startGame(s: GameSetup) {
    setSetup(s);
    setInGame(true);
    setGameId((id) => id + 1);
    pgnRef.current = '';
    saveState({ setup: s, pgn: '', inGame: true });
  }

  function onPgnChange(pgn: string) {
    pgnRef.current = pgn;
    if (setup) saveState({ setup, pgn, inGame: true });
  }

  function newPlayers() {
    setInGame(false);
    clearState();
  }

  return (
    <main className="app-shell">
      <h1>Royal Us</h1>
      {inGame && setup ? (
        <GameScreen
          key={gameId}
          setup={setup}
          initialPgn={pgnRef.current}
          onPgnChange={onPgnChange}
          onNewPlayers={newPlayers}
        />
      ) : (
        <>
          <p className="tagline">
            Ordinary chess — except the King and Queen are <em>you and your friend</em>. Protect
            yourselves.
          </p>
          <SetupWizard initial={setup} onComplete={startGame} />
        </>
      )}
    </main>
  );
}
