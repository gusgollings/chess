# Royal Us ♛

Ordinary chess — except the King and Queen are **you and your friend**.

Before the game, each player nominates themself as either the King or the
Queen of their army, names a friend as the other royal piece, and gives both
of them cartoon avatars generated from a photo (uploaded, or taken live with
the browser camera). The board then shows your actual faces on the royal
squares, and the game talks about them by name:

- Check → **"⚠ Goldie is in danger! Protect your friend!"**
- Your queen falls → **"💔 Gus has been captured! Goldie has taken you!"**
- Checkmate → **"👑 Checkmate — Gus's army wins! Goldie has fallen."**

Two players, one computer, pass-and-play. The stakes are personal.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

> The camera capture needs a secure context (localhost or HTTPS). Photo
> upload works anywhere. Photos never leave the browser — the cartoon
> filter is pure client-side canvas work, and everything is stored only in
> your browser's localStorage.

Other scripts:

```bash
npm test         # unit tests (engine adapter, cartoonify maths, messaging, storage)
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build
```

## How it's built

- **TypeScript + React 18 + Vite** — see [SPEC.md](SPEC.md) for the full
  architecture, data model, and milestone plan.
- **chess.js** provides all rules: legal moves, castling, en passant,
  promotion, check/checkmate/stalemate/draws.
- **Cartoonify pipeline** (`src/avatar/cartoonify.ts`): box blur →
  saturation-boosted posterise → Sobel ink lines → circular mask. Pure
  functions over pixel buffers, unit-tested without a canvas.
- **State** (`src/state/`): player/royal name resolution, personalised
  messaging, localStorage persistence (setup + PGN survive a refresh).

## Project layout

```
src/
  engine/game.ts        thin adapter over chess.js (+ tests)
  avatar/cartoonify.ts  photo → cartoon avatar pipeline (+ tests)
  state/players.ts      PlayerConfig, royal name resolution (+ tests)
  state/messages.ts     personalised danger/capture/victory text (+ tests)
  state/storage.ts      localStorage save/load (+ tests)
  components/
    SetupWizard.tsx     two-step pass-and-play setup
    AvatarStudio.tsx    upload / camera / crop / cartoonify flow
    Board.tsx, Piece.tsx, GameScreen.tsx, CapturedTray.tsx,
    PromotionDialog.tsx
```
