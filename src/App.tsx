import { useState } from 'react';
import AvatarStudio from './components/AvatarStudio';
import GameScreen from './components/GameScreen';

export default function App() {
  // Temporary M3 demo entry point; replaced by the setup wizard in M4.
  const [studioOpen, setStudioOpen] = useState(false);
  const [demoAvatar, setDemoAvatar] = useState<string | null>(null);

  return (
    <main className="app-shell">
      <h1>Royal Us</h1>
      <div className="game-controls" style={{ marginBottom: '1rem' }}>
        <button onClick={() => setStudioOpen(true)}>🎨 Avatar studio demo</button>
        {demoAvatar && (
          <img src={demoAvatar} alt="demo avatar" style={{ width: 40, borderRadius: '50%' }} />
        )}
      </div>
      <GameScreen />
      {studioOpen && (
        <AvatarStudio
          title="Avatar studio demo"
          onDone={(url) => {
            setDemoAvatar(url);
            setStudioOpen(false);
          }}
          onCancel={() => setStudioOpen(false)}
        />
      )}
    </main>
  );
}
