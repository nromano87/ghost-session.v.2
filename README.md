# Ghost Session

Collaborative music production platform — share stems, mixes, and collaborate in real-time.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/austinromano/ghostsession.v3.git
cd ghostsession.v3

# 2. Install dependencies
pnpm install

# 3. Start the server (creates SQLite DB automatically)
pnpm dev:server

# 4. In a new terminal, start the frontend
pnpm dev:desktop
```

The server runs on `http://localhost:3000` and the frontend on `http://localhost:1420`.

Open `http://localhost:1420` in your browser to use the app. Register an account to get started.

## Environment Variables (Optional)

No `.env` file is required — the app works out of the box with defaults.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_PATH` | `./ghost_session.db` | SQLite database file path |
| `PORT` | `3000` | Server port |
| `S3_ENDPOINT` | — | S3-compatible storage endpoint (uses local `uploads/` if not set) |
| `S3_BUCKET` | — | S3 bucket name |
| `S3_ACCESS_KEY` | — | S3 access key |
| `S3_SECRET_KEY` | — | S3 secret key |
| `S3_REGION` | `auto` | S3 region |

## Project Structure

```
ghostsession.v3/
├── apps/
│   ├── server/       # Node.js API server (Hono + SQLite + Socket.IO)
│   ├── desktop/      # React frontend (Vite + Tailwind + Zustand)
│   └── plugin/       # JUCE audio plugin (C++ — optional, requires JUCE SDK)
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── protocol/     # WebSocket protocol definitions
│   └── tokens/       # Design tokens
└── package.json
```

## Building the JUCE Plugin (Optional)

The JUCE plugin is only needed if you want the VST3/standalone audio plugin. Most users only need the server + frontend.

Requirements: CMake, JUCE SDK, C++ compiler, WebView2 SDK (Windows).

```bash
# Place JUCE SDK in the repo root as ./JUCE/
cd apps/plugin
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```
