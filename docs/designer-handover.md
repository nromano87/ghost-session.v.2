# Ghost Session — UI / UX handover for design

## What this product is

**Ghost Session** is a **collaborative music production platform**. Users work in **projects** with **tracks**, **versions** (snapshots of progress), **comments**, **project chat**, **members/roles**, and (in some surfaces) **sample packs**, **invitations**, and **friends**. The backend is a real API with auth, projects, files (S3 or local fallback), and **real-time updates** over WebSockets (Socket.IO).

The goal of the UI work is to make the experience feel **polished, legible, and purposeful** for producers who split time between a **desktop app** and a **DAW plugin** that embeds the same web UI.

---

## Where the UI runs (important for your constraints)

There are **three host environments**, all using the **same React + Vite + Tailwind** codebase:

1. **Tauri desktop app** — primary "full" app: routing, sidebar, projects, settings, etc.
2. **JUCE plugin WebView** — detected when `?mode=plugin` is in the URL or the user agent contains `GhostSession`. In this mode the app shows a **large, self-contained layout** (`PluginLayout`) instead of normal React Router pages. Auth can be bootstrapped via a **token in the URL**, then persisted locally.
3. **Plain browser** (possible in dev) — same as desktop minus native shell.

**Design implications:** layouts must work at **tight widths/heights** inside a plugin window, **touch targets** and density should be considered, and **avoid assuming** only one navigation pattern (sidebar app vs single-pane plugin).

---

## Information architecture (routes and shells)

### Standard desktop shell (AppShell)

After login, users get:

- **Sidebar:** brand, **Projects**, **Settings**, user block at bottom. (Nav icons are currently placeholder characters, not real icons.)
- **Header:** page title derived from route.
- **Main:** scrollable content.

**Routes under `/`:**

| Path | Screen | Purpose |
|------|--------|---------|
| `/` | redirect | → `/projects` |
| `/projects` | **Projects list** | Grid of project cards, create project modal, empty state |
| `/projects/:id` | **Project detail** | Tabs: **Tracks**, **Comments**, **Versions**, **Members**; optional right column chat on XL breakpoints |
| `/settings` | **Settings** | Connection (server URL, download dir), listen volume, account + sign out |

### "Session" / DAW-style shell (SessionShell)

Used under **`/sessions`** and **`/sessions/:id`**:

- **Top bar** (TopNavBar): logo + tabs **PROJECTS**, **SESSIONS**, **LIBRARY**, **AI ASSIST** (plus search/settings-style icon buttons). **Note:** In code, **Library and AI Assist routes are not wired** in the main router yet — the tabs are **partially speculative UI**.
- **Left column** (SessionSidebar): "Sessions" list (projects or placeholder names), "Favorites" label, **Collaborators** list (real online users or placeholder).
- **Center** (SessionWorkspacePage): session header with **back control**, project name, **transport-style controls**, **Invite** button; main area is **track timeline**.
- **Right** (SessionChat): project chat panel.
- **Bottom** (BottomPanel): creative controls (e.g. "Ghost Keys" XY pad, knobs) — reads as **instrument / vibe** UI, not strictly data-driven yet.

### Plugin-only UI (PluginLayout)

A **single large view** (large source file) that combines:

- Branding header
- **Friends** panel
- Collapsible **Favorites**, **Projects**, **Sample packs**
- Main content area for the selected project or pack
- Flows for **invitations** (accept/decline), packs, and collaboration affordances

Treat this as the **most feature-dense** surface; it is where much of the "product" UI currently lives for the DAW context.

### Auth

- **`/login`** and **`/register`** — email/password; register enforces minimum password length on the server.
- Plugin mode: if not authenticated, only **Login** is shown (no separate register route in that branch).

---

## Core user journeys (what exists today)

1. **Onboarding:** Register → land in app → **Projects** list.
2. **Create / open project:** Create modal → card grid → open **project detail**.
3. **Manage a project:**
   - **Tracks:** list rows with mute/solo/delete; add track modal (name + type: audio, MIDI, drums, loop).
   - **Comments:** thread list, add comment (inline input + post).
   - **Versions:** list + "Save version" modal.
   - **Members:** avatars, names, role badges (e.g. owner vs editor).
4. **Real-time:** Joining a project hooks **WebSocket** session; chat and presence-oriented UI appear in multiple places.
5. **Session workspace:** DAW-like view with timeline + transport + invite affordance + chat + bottom creative panel.
6. **Settings:** Mostly **UI placeholders** for server URL and download directory (not necessarily wired to persistence everywhere) — good candidate for **settings IA** and visual hierarchy.
7. **Plugin:** Richer navigation (friends, packs, invitations) in one layout.

---

## Visual system today (what to reconcile)

### Shared design tokens (`packages/tokens`)

There is a **`tokens.json`** with semantic colors (background, surfaces, borders, accent greens/cyans/purples, track-type colors, waveform, playhead, text steps), plus spacing, radii, and font size steps. This is the **intended** cross-app contract.

### Tailwind in the desktop app

`tailwind.config.ts` defines a parallel **`ghost.*` palette** (darker blacks, slightly different purple/cyan, Discord-adjacent feel). **`globals.css`** references those Tailwind tokens and adds:

- Body: dark surface, **no page scroll** (`overflow: hidden` on `body` — app is region-scrolled).
- Thin **Discord-style** scrollbars.
- Utility classes: **`ghost-card`**, **`ghost-input`**, playhead animation, volume slider styling.

**Handover note for design:** There is **intentional drift** between `tokens.json` and Tailwind's `ghost` colors. A design refresh should either **pick one source of truth** or define a clean mapping so engineering can align tokens + Tailwind in one pass.

### Typography

Tailwind sets **`gg sans`** first in the stack (may not be installed — falls through to Noto Sans / system). Worth deciding on **licensed web fonts** vs system stack for both desktop and embedded WebView.

### Motion and density

Session UI uses **small caps labels**, **tight tracking**, and **11px–15px** type in places — very "tooling" / DAW-adjacent. Project detail is slightly more "dashboard-like." Unifying **type scale** and **spacing rhythm** would help cohesion.

---

## Component inventory (reuse vs redesign)

Reusable pieces designers should know about:

- **Layout:** AppShell, SessionShell, Sidebar, Header, TopNavBar, SessionSidebar, BottomPanel, PluginLayout
- **Common:** Button, Input, Modal, Badge, Avatar, StatusDot
- **Projects:** ProjectCard, CreateProjectModal
- **Session:** TrackRow, TrackTimeline, TransportControls, ChatPanel, SessionChat
- **Comments:** CommentThread
- **Versions:** VersionRow

New designs can **swap visuals** inside these boundaries or propose new organisms (e.g. unified project header, timeline chrome, comment composer).

---

## Known UX gaps / honest state of the UI

Worth flagging so design is not surprised:

- **Two parallel experiences:** "Projects" detail vs "Sessions" workspace can feel like **two apps**; users may not understand when to use which.
- **Top nav tabs** (Library, AI Assist) **do not match implemented routes** — either design for future features or help product **remove/hide** until real.
- **Session sidebar** session list may show **placeholder projects** when the store is empty — design should account for **empty / loading / error** states.
- **Collaborators** similarly may show placeholders — presence design should distinguish **real vs mock**.
- **Settings** fields may not all persist — treat as **UX + eng backlog** to define behavior.
- **Plugin layout** is **monolithic** — a design system pass could break it into documented sections (nav, lists, detail, modals).

---

## Deliverables that would help engineering most

1. **User flows:** primary paths for desktop vs plugin (same mental model or deliberately different?).
2. **Screen map** aligned to actual routes + plugin mode.
3. **Component library spec:** buttons, inputs, tabs, cards, list rows, timeline chrome, chat bubble, modals, empty states, error states.
4. **Responsive / resize rules:** minimum width/height for plugin WebView vs desktop window.
5. **Token spec:** single table for color, type, spacing, elevation — and whether **light mode** is in scope (currently **dark-only**).
6. **Iconography:** replace placeholder sidebar "icons" and align with a single icon set.
7. **Accessibility:** focus states, contrast on green/cyan on dark, hit targets for timeline controls.

---

## Repo pointers (for Figma notes or dev handoff)

- Desktop UI root: `apps/desktop/src/`
- Routing: `apps/desktop/src/App.tsx`
- Global styles: `apps/desktop/src/styles/globals.css`
- Tailwind theme: `apps/desktop/tailwind.config.ts`
- Shared tokens: `packages/tokens/tokens.json`
- Large plugin UI: `apps/desktop/src/components/plugin/PluginLayout.tsx`

---

## One-line summary for the designer

**Ghost Session** is a dark, DAW-inspired collaboration tool with **two major UI modes** (standard app vs session workspace vs plugin), **real projects/tracks/comments/versions/members/chat**, and a **token + Tailwind visual system that should be unified**. The biggest design opportunity is **one coherent product story**, **clear navigation between "manage project" and "work in session"**, and **polished, consistent components** across desktop and plugin.

---

*Generated for design handover. Attach Figma access and screenshots of Projects, Session workspace, and Plugin modes when sharing.*
