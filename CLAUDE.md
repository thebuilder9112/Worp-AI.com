# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start local dev server (runs server.ts via tsx, serves on port 3000)
npm run build     # Vite production build → dist/
npm run lint      # TypeScript type-check (tsc --noEmit), no test suite exists
npm run preview   # preview production build locally
```

## Architecture

**Worp AI** is a terminal-styled AI chat SPA built with React + Vite, deployed as a static site to GitHub Pages at `https://thebuilder9112.github.io/Worp-AI.com/`.

### Deployment vs. Local Dev

- **Production (GitHub Pages)**: purely static. The Vite build bakes `VITE_API_KEY` into the bundle. The Gemini API is called directly from the browser in `src/lib/gemini.ts`.
- **Local dev**: `server.ts` (Express) runs as a dev server with Vite middleware. It also has `/api/chat/stream` and `/api/chat` proxy routes, but these are **not used in production**.
- Vite base path is `/Worp-AI.com/` in production, `/` in dev (`vite.config.ts`).
- CI/CD: push to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys to GitHub Pages. `VITE_API_KEY` must be set as a GitHub Actions secret.

### AI / Gemini

`src/lib/gemini.ts` — exports `streamChat()`, an async generator. It calls the Gemini REST SSE endpoint directly from the browser:

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=VITE_API_KEY
```

History is passed as `{ role: 'user'|'model', parts: [{ text }] }[]`. The `_mode` parameter (standard/code/art/research) is accepted for API compatibility but not sent to Gemini.

### Global State — ThemeContext

`src/lib/ThemeContext.tsx` owns all cross-cutting state via React context:
- **Auth**: `user` (Firebase `User | null`), `profile` (Firestore `UserProfile`)
- **Theme**: `theme` (one of 7 presets), `accentColor` (RGB string like `"16 185 129"`), `isDarkMode`
- **UI mode**: `friendlyMode` (softer UI vs. terminal), `chatMode` (standard/code/art/research)

Theme state applies CSS custom properties directly on `document.documentElement`:
- `--accent-color` and `--accent-glow` (used throughout via `text-theme-accent`, `bg-theme-accent-glow` Tailwind utilities)
- `data-theme`, `data-chat-mode`, `data-friendly`, `data-dark` attributes

For signed-in users, theme preferences are persisted to Firestore and synced in real-time. For guests, they go to `localStorage` (`warpmind-*` keys).

### Firebase

`src/lib/firebase.ts` — initializes Firebase from `firebase-applet-config.json` (checked in, not secret). Uses Google Auth and Firestore.

Firestore schema:
```
/users/{uid}                              ← UserProfile (theme, accentColor, displayName)
/users/{uid}/sessions/{sessionId}         ← ChatSession (title, mode, createdAt)
/users/{uid}/sessions/{sessionId}/messages/{msgId}  ← { role: 'user'|'model', text, timestamp }
```

Messages are stored flat (separate user/model docs), then reconstructed into `Message[]` pairs in `App.tsx` via `reduce`.

### Key Components

- `src/App.tsx` — monolithic root component: sidebar, chat history, input, all dialogs. Contains `handleSendCommand` (streams from Gemini, saves to Firestore in parallel).
- `src/components/ChatBlock.tsx` — renders a single user/model message pair with Markdown, KaTeX math, and code highlighting.
- `src/lib/ThemeContext.tsx` — global state provider (wrap with `useTheme()` to access).
- `src/components/TerminalEffects.tsx` — CRT scanline overlay (toggled via `crtEnabled` state).
- `src/components/CommandPalette.tsx` — `Ctrl+K` command palette.

### Virtual Filesystem (Project Tab)

`App.tsx` scans the last AI response for fenced code blocks with `title=` or `filename=` attributes using a regex, and populates `virtualFiles` state shown in the sidebar "Project" tab.

### Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `VITE_API_KEY` | GitHub Actions secret / local `.env` | Google Gemini API key |

For local dev, create a `.env` file (see `.env.example`). The key is embedded in the production bundle.
