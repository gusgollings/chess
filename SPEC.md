# Royal Us — Personalised Pass-and-Play Chess

## Concept

Ordinary chess, extraordinary stakes. Before the game starts, each player
nominates themself as either the **King** or the **Queen** of their army, and
names a friend as the other royal piece. Both royals get a cartoon avatar
generated from a photo (uploaded, or taken live with the browser camera). The
board then shows *you* and *your friend* standing on the royal squares.

When your king is in check, the game doesn't say "Check" — it says
**"Gus is in danger!"**. When your queen falls, it says
**"Goldie has been captured!"**. You have to protect yourself. You have to
protect your friend.

Both players share one computer (pass-and-play / hot-seat). There is no
network play, no accounts, and no server: photos never leave the browser.

## Language & Architecture Choice

| Decision | Choice | Why |
|---|---|---|
| Language | TypeScript | Type safety across game state, avatar pipeline, and UI; single language for everything. |
| UI framework | React 18 | Declarative board rendering; the setup wizard and modals are naturally component-shaped. |
| Build tool | Vite | Instant dev server, zero-config TS/React, static build output deployable anywhere. |
| Chess rules | chess.js | Battle-tested legal-move generation, check/checkmate/stalemate/draw detection, FEN/PGN. Writing a rules engine is not the point of this project. |
| Avatar pipeline | Canvas 2D API (no ML, no server) | A posterise + edge-detection filter gives a convincing "cartoon" look, runs in milliseconds, works offline, and keeps photos 100% private. |
| Camera | `navigator.mediaDevices.getUserMedia` | Standard browser API; graceful fallback to file upload where unavailable. |
| Persistence | `localStorage` | Survive an accidental refresh mid-game (state + avatars as data URLs). |
| Testing | Vitest + Testing Library | Unit tests for game adapter and image maths; fast, Vite-native. |

### High-level architecture

```
┌────────────────────────────────────────────────────────────┐
│ React App                                                  │
│                                                            │
│  SetupWizard ──────────► PlayerConfig ×2                   │
│   ├─ NameForm             { name, friendName,              │
│   ├─ RolePicker             myRole: 'king' | 'queen',      │
│   └─ AvatarStudio           avatars: { king, queen } }     │
│       ├─ PhotoUpload                                       │
│       ├─ CameraCapture (getUserMedia)                      │
│       ├─ Cropper (drag / zoom square crop)                 │
│       └─ cartoonify()  ← pure canvas pipeline              │
│                                                            │
│  GameScreen                                                │
│   ├─ Board ── Square ── Piece (avatar for K/Q)             │
│   ├─ TurnBanner / AlertBanner ("Gus is in danger!")        │
│   ├─ CapturedTray (fallen royals shown by face)            │
│   └─ GameOverModal                                         │
│                                                            │
│  engine/game.ts   thin adapter over chess.js               │
│  avatar/cartoonify.ts   pure image pipeline                │
│  state/store.ts   game + config state, localStorage sync   │
└────────────────────────────────────────────────────────────┘
```

### Key data model

```ts
type Role = 'king' | 'queen';

interface PlayerConfig {
  color: 'w' | 'b';
  myName: string;        // the player at the keyboard
  myRole: Role;          // which royal piece is "me"
  friendName: string;    // the other royal piece
  avatars: {             // cartoonified data URLs
    king: string | null;
    queen: string | null;
  };
}
```

`royalName(config, role)` resolves which human name belongs to which piece, so
alerts can say the right thing: if Gus chose Queen, a check reads
"Goldie (your king) is in danger!" and losing the queen reads
"Gus has been captured!".

### Cartoonify pipeline (avatar/cartoonify.ts)

1. Square-crop the source (user-adjustable pan/zoom) and downscale to 256×256.
2. Smooth: box blur to flatten skin/photo noise.
3. Posterise: quantise each RGB channel to ~6 levels, with a saturation boost —
   this produces the flat "cel shading" cartoon colours.
4. Ink lines: Sobel edge detection on luminance; composite dark strokes on top.
5. Circular mask + coloured ring (white/black army) → PNG data URL.

## Rules of play (unchanged chess + presentation layer)

- Full standard chess via chess.js: legal moves only, castling, en passant,
  promotion (chooser dialog), check, checkmate, stalemate, draws.
- Pass-and-play: one browser, players alternate. Board flips (optional toggle)
  so the mover plays "up the board".
- Royal events are personalised:
  - Check → "⚠ {name} is in danger!"
  - Queen captured → "{name} has been captured!"
  - Checkmate → "{winnerName}'s army wins — {loserKingName} has fallen."

## Milestones

Each milestone ends in a working, committed state on the feature branch.

- **M0 — Spec.** This document. *(commit: docs: project spec)*
- **M1 — Scaffold.** Vite + React + TS project, chess.js + Vitest wired,
  lint/typecheck/test/build scripts green. *(commit: chore: scaffold)*
- **M2 — Playable chess.** Engine adapter with tests; board UI; tap-to-move
  with legal-move highlights; turn banner; check/checkmate/stalemate/draw
  detection; pawn promotion dialog; pass-and-play flow. Unicode pieces for now.
  *(commit: feat: playable pass-and-play chess)*
- **M3 — Avatar studio.** Photo upload + camera capture, pan/zoom square crop,
  cartoonify pipeline (with unit tests on the pure maths), circular avatar
  output. Standalone, demoable component. *(commit: feat: avatar studio)*
- **M4 — Personalisation.** Setup wizard (both players: name, king-or-queen
  role, friend's name, two avatars); avatars rendered on the royal pieces;
  names resolved throughout the UI. *(commit: feat: setup wizard + royal avatars)*
- **M5 — Stakes & polish.** Personalised danger/capture/game-over messaging,
  captured-royals tray with faces, board flip, restart/new-players flows,
  localStorage persistence, README. *(commit: feat: personalised stakes + polish)*

## Out of scope (deliberately)

Network play, engines/AI opponents, clocks, move-list export UI, accounts,
server-side anything.
