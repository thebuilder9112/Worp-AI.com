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
- **Local dev**: `server.ts` (Express + tsx) runs as a dev server with Vite middleware. It also has `/api/chat/stream` (SSE) and `/api/chat` proxy routes, but these are **not used in production** — the browser calls Gemini directly.
- Vite base path is `/Worp-AI.com/` in production, `/` in dev (`vite.config.ts`).
- `@` path alias resolves to `./src` (configured in `vite.config.ts`).
- CI/CD: push to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys to GitHub Pages. `VITE_API_KEY` must be set as a GitHub Actions secret.

### AI / Gemini

`src/lib/gemini.ts` — exports `streamChat()`, an async generator. It calls the Gemini REST SSE endpoint directly from the browser:

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=VITE_API_KEY
```

Signature: `streamChat(message, history, _mode?, attachedFile?)`. History is `{ role: 'user'|'model', parts: [{ text }] }[]`. The `_mode` parameter (standard/code/art/research) is accepted for API compatibility but not sent to Gemini. `attachedFile` is `{ name, type, data: base64 }` and is sent as an `inlineData` part alongside the user text.

> Note: `@google/genai` is in `package.json` and used only in `server.ts` (proxy routes with `gemini-3-flash-preview`). Those routes are unused in production. `gemini.ts` calls the REST API directly via `fetch`.

### Global State — ThemeContext

`src/lib/ThemeContext.tsx` owns all cross-cutting state via React context:
- **Auth**: `user` (Firebase `User | null`), `profile` (Firestore `UserProfile`)
- **Theme**: `theme` (one of 7 presets + `'custom'`), `accentColor` (RGB string like `"16 185 129"`), `isDarkMode`
- **UI mode**: `friendlyMode` (softer UI vs. terminal), `chatMode` (standard/code/art/research)

Theme state applies CSS custom properties directly on `document.documentElement`:
- `--accent-color` and `--accent-glow` (used throughout via `text-theme-accent`, `bg-theme-accent-glow` Tailwind utilities)
- `data-theme`, `data-chat-mode`, `data-friendly`, `data-dark` attributes

For signed-in users, theme preferences are persisted to Firestore and synced in real-time via `onSnapshot`. For guests, they go to `localStorage` (`warpmind-theme`, `warpmind-accent`, `warpmind-friendly`, `warpmind-dark` keys).

The `UserProfile` interface in `src/lib/firebase.ts` does not declare `friendlyMode` or `isDarkMode` — `ThemeContext` accesses them with `@ts-ignore`. Extend the interface if adding new persisted fields.

### Firebase

`src/lib/firebase.ts` — initializes Firebase from `firebase-applet-config.json` (checked in, not secret). Uses Google Auth and Firestore. The Firestore database ID comes from `firebaseConfig.firestoreDatabaseId`.

Firestore schema:
```
/users/{uid}                              ← UserProfile (theme, accentColor, displayName, friendlyMode, isDarkMode)
/users/{uid}/sessions/{sessionId}         ← ChatSession (title, mode, createdAt)
/users/{uid}/sessions/{sessionId}/messages/{msgId}  ← { role: 'user'|'model', text, timestamp }
```

Messages are stored flat (separate user/model docs), then reconstructed into `Message[]` pairs in `App.tsx` via `reduce`. The sidebar shows at most the last 20 sessions (Firestore `limit(20)`).

### Key Components

- `src/App.tsx` — monolithic root component: sidebar, chat history, input, all dialogs. `handleSendCommand` streams from Gemini and saves to Firestore in parallel. Also handles file attachment (`handleFileChange`) and voice input (Web Speech API via `recognitionRef`). Virtual file extraction from AI responses populates the "Project" sidebar tab.
- `src/components/ChatBlock.tsx` — renders a single user/model message pair with Markdown (remark-gfm), KaTeX math (remark-math + rehype-katex), and code highlighting. Code blocks expose a copy button, Live Preview (eye icon), Run Snippet, and PDF export (jsPDF).
- `src/components/CommandInput.tsx` — input bar with mode-aware prompt suggestions. Suggestions are defined per `chatMode` and shown when the input is empty.
- `src/components/CodeRunner.tsx` — in-browser JS/TS execution via `new Function('console', code)` with a captured console shim. Only rendered for `javascript`/`typescript`/`js`/`ts` code blocks.
- `src/components/LivePreview.tsx` — renders HTML or JS code in a sandboxed `<iframe srcDoc>`. JS/TS is wrapped in a minimal HTML shell with Tailwind CDN injected. Supports fullscreen.
- `src/lib/ThemeContext.tsx` — global state provider (wrap with `useTheme()` to access).
- `src/components/TerminalEffects.tsx` — CRT scanline overlay (toggled via `crtEnabled` state in `App.tsx`).
- `src/components/CommandPalette.tsx` — `Ctrl+K` command palette. Actions are defined in `App.tsx` and passed as props.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Open command palette |
| `Ctrl+L` | Clear current chat |
| `Enter` | Submit message |

### Virtual Filesystem (Project Tab)

`App.tsx` scans the last AI response for fenced code blocks with `title=` or `filename=` attributes using a regex, and populates `virtualFiles` state shown in the sidebar "Project" tab.

### Styling

- **Tailwind v4** via `@tailwindcss/vite` plugin — there is no `tailwind.config.js`. Custom utilities are configured in `src/index.css`.
- **shadcn/ui** components live in `src/components/ui/`. They use `cn()` from `src/lib/utils.ts` for class merging. `components.json` controls shadcn CLI settings.
- **Animations**: uses the `motion` package (not `framer-motion`) throughout.

### Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `VITE_API_KEY` | GitHub Actions secret / local `.env` | Google Gemini API key (baked into bundle at build time) |

For local dev, create a `.env` file (see `.env.example`). The key is embedded in the production bundle.
