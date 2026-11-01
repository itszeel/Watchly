# 🎬 Watchly

Watchly seamlessly connects your YouTube browsing experience with a personal video management dashboard. It automatically tracks open video tabs, provides in-page playback speed controls for YouTube Shorts, adds convenient new-tab buttons to video thumbnails, and syncs everything in real time to a Next.js web application powered by Convex.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Browser Extension (`apps/extension`)](#1-browser-extension-appsextension)
  - [Web Dashboard (`apps/web`)](#2-web-dashboard-appsweb)
  - [Backend & Shared Packages (`packages/`)](#3-backend--shared-packages-packages)
- [Monorepo Architecture](#-monorepo-architecture)
- [Tech Stack](#-tech-stack)
- [Performance & Engineering Highlights](#-performance--engineering-highlights)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Loading the Extension in Chrome](#-loading-the-extension-in-chrome)
- [Project Scripts](#-project-scripts)
- [License](#-license)

---

## 🌟 Overview

YouTube is where we learn, research, and consume content, but managing dozens of open video tabs or tracking what we’ve actually watched quickly becomes chaotic.

**Watchly solves this with a two-part ecosystem:**

1. **A lightweight browser extension** that enhances the YouTube interface and tracks your open video tabs in the background.
2. **A real-time web application** where you can view your active tabs, organize imported playlists / watch-later queues, and toggle watch statuses.

Everything is kept instantly in sync using **Convex**, providing a reactive, serverless real-time database layer.

---

## ✨ Key Features

### 1. Browser Extension (`apps/extension`)

Built on **WXT (Web Extension Tools)** for Manifest V3 with React 19:

- **⚡ Real-Time Tab Tracking**:
  - Detects open YouTube watch tabs automatically.
  - Synchronizes tab state with the Convex cloud database without draining memory or battery.

- **🏷️ In-Page Status Chip**:
  - Injects a sleek status badge (`Added` in blue, `Watched` in green) right into the YouTube masthead next to the search bar.
  - Lets you know immediately if the video you're watching is currently tracked or already completed.

- **⏩ YouTube Shorts Speed Controller**:
  - Injects a floating speed button into the YouTube Shorts right action bar.
  - Features an active speed indicator ring that glows when speed is not 1x.
  - Includes a glassmorphism dropdown menu with speeds ranging from **0.25x to 3.0x**.
  - Quick **"1x Normal"** reset button to return to standard speed in one click.

- **↗️ Thumbnail "Open" Button**:
  - Overlays an instant "Open in new tab" button on video thumbnails and hover preview players.
  - Prevents losing your place in your feed when browsing recommendations.

- **🎛️ Modern Popup Control Center**:
  - Live status header displaying active tab counts with an animated refresh sync button.
  - **Feature Toggles**: Toggle switches for both the "Open Button" and "Shorts Speed" features that take effect across open YouTube tabs immediately without page reloads (persisted via `chrome.storage.local`).
  - **Quick Tab Switcher**: Click any video card in the popup list to jump directly to that browser tab.

---

### 2. Web Dashboard (`apps/web`)

Built with **Next.js 16 (App Router)** and **Tailwind CSS v4**:

- **📊 Unified Video Management**:
  - **Browser Tabs View**: Real-time list of all open YouTube videos across your devices.
  - **Watch Later / Playlist Queue**: Import entire YouTube playlists using the built-in scraping API (`/api/scrape-playlist`) and batch-save them to your list.
- **✅ Status Toggles**:
  - Mark videos as `added` or `watched` with recorded completion timestamps.
  - Automatically updates the badge status inside the YouTube browser extension in real time.
- **🔐 Authentication**:
  - Simple, secure credential login flow protecting personal watch queues.
- **📱 Mobile-First Responsive Design**:
  - Native-like mobile experience with smooth bottom navigation and touch-optimized gestures.

---

### 3. Backend & Shared Packages (`packages/`)

- **`@watchly/convex` (`packages/convex`)**:
  - Shared Convex schemas, server mutations, queries, and client wrappers used by both the web app and extension.
  - Video state tracking with indices on `videoId` for O(1) query lookups.
  - Mutation handlers: `save`, `toggleStatus`, `remove`, `syncBrowserTabs`, `batchSave`, and `listBySource`.
- **`@repo/ui` (`packages/ui`)**:
  - Shared React component library.
- **`@repo/eslint-config` & `@repo/typescript-config`**:
  - Monorepo-wide linting and TypeScript compiler presets.

---

## 🏗️ Monorepo Architecture

```
Watchly/
├── apps/
│   ├── extension/          # Chrome / Firefox extension (WXT + Manifest V3 + React 19)
│   │   ├── entrypoints/
│   │   │   ├── background.ts     # Service worker (tab query, Convex sync, status caching)
│   │   │   ├── content.ts        # Content script (consolidated observer, masthead chip)
│   │   │   └── popup/            # Extension popup React application
│   │   └── utils/
│   │       ├── shorts-speed.ts   # Shorts playback speed controller & dropdown
│   │       ├── thumbnail-button.ts # Thumbnail open-in-new-tab overlay button
│   │       └── feature-storage.ts# Local storage flag helpers for feature toggles
│   │
│   └── web/                # Next.js 16 Web Dashboard (React 19 + Tailwind v4)
│       └── app/
│           ├── api/scrape-playlist/ # Playlist scraper endpoint
│           ├── components/          # VideoList, BottomNav, AuthProvider
│           └── page.tsx             # Main dashboard interface
│
├── packages/
│   ├── convex/             # Shared Convex schema, backend functions & client
│   │   └── convex/
│   │       ├── schema.ts   # Database schema (videos table & indices)
│   │       └── videos.ts   # Queries & mutations
│   ├── ui/                 # Shared UI component library
│   ├── eslint-config/      # Shared ESLint rules
│   └── typescript-config/  # Shared tsconfig bases
│
├── turbo.json              # Turborepo task pipeline configuration
├── pnpm-workspace.yaml     # pnpm workspace definition
└── package.json            # Root workspace scripts and dependencies
```

---

## 💻 Tech Stack

| Layer                  | Technologies                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Monorepo**           | [Turborepo](https://turbo.build/), [pnpm Workspaces](https://pnpm.io/workspaces)   |
| **Browser Extension**  | [WXT](https://wxt.dev/) (Vite), Manifest V3, React 19, Tailwind CSS v4, TypeScript |
| **Web Application**    | [Next.js 16](https://nextjs.org/) (App Router), React 19, Tailwind CSS v4          |
| **Backend & Database** | [Convex](https://www.convex.dev/) (Serverless Realtime Reactive Database)          |
| **Styling**            | [Tailwind CSS v4](https://tailwindcss.com/), Glassmorphism CSS                     |
| **Tooling**            | TypeScript 5.9, ESLint 9, Prettier, Husky                                          |

---

## 🚀 Performance & Engineering Highlights

The extension is engineered to run seamlessly on YouTube's high-frequency DOM without causing stutter or battery drain:

1. **Single Unified `MutationObserver`**:
   - Instead of multiple modules watching the entire DOM tree, a single centralized observer coordinates URL changes and feature updates.
2. **Eliminated Layout Thrashing**:
   - Replaced costly per-element `window.getComputedStyle()` lookups with CSS `:where()` specificity rules.
   - Shorts speed action bar detection uses YouTube's native `[is-active]` reel marker for instantaneous O(1) query lookups without forcing synchronous `getBoundingClientRect()` reflows.
3. **Template Cloning (`cloneNode`)**:
   - Button templates with SVG icons are instantiated once and cloned per thumbnail, speeding up initial page injection.
4. **Memory Leak Prevention (`WeakRef`)**:
   - Thumbnail element references use `WeakRef<HTMLElement>`, ensuring elements scrolled out of view by YouTube's virtual scroller can be garbage-collected immediately.
5. **Smart Background Polling & In-Memory TTL Cache**:
   - IPC status queries are cached in service worker memory (15s TTL) to prevent redundant HTTP requests to Convex.
   - Polling only runs on active `/watch?v=` pages and automatically pauses when navigating away.

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `>= 20.x`
- [pnpm](https://pnpm.io/) `>= 9.x`

### Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/itszeel/Watchly.git
cd Watchly
pnpm install
```

### Environment Variables

1. **Convex Backend**: Initialize or link your Convex deployment:

   ```bash
   cd packages/convex
   npx convex dev
   ```

   This will generate your deployment URL and set up `.env.local`.

2. **Web App**: Create `apps/web/.env.local`:

   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment-name.convex.cloud
   ```

3. **Extension**: Create `apps/extension/.env`:
   ```env
   VITE_CONVEX_URL=https://your-deployment-name.convex.cloud
   ```

### Running Locally

You can run all applications in parallel using Turborepo:

```bash
# Start all dev servers (Web + Extension + Convex)
pnpm run dev
```

Or run individual apps:

```bash
# Run web app only (starts on http://localhost:5000)
pnpm --filter web dev

# Run extension in watch mode
pnpm --filter watchly-extension dev

# Run Convex dev server
pnpm --filter @watchly/convex dev
```

---

## 🧩 Loading the Extension in Chrome

1. Build or run the extension in dev mode:
   ```bash
   pnpm --filter watchly-extension build
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the `apps/extension/.output/chrome-mv3` directory.
6. Navigate to [YouTube](https://www.youtube.com) and test the features!

---

## 📜 Project Scripts

Run these from the workspace root:

| Command                                 | Description                                                   |
| --------------------------------------- | ------------------------------------------------------------- |
| `pnpm run dev`                          | Start development servers for all workspaces                  |
| `pnpm run build`                        | Build all applications and packages for production            |
| `pnpm run compile`                      | Run TypeScript type checks across workspaces (`tsc --noEmit`) |
| `pnpm run lint`                         | Run ESLint across all projects                                |
| `pnpm --filter watchly-extension build` | Build the Chrome MV3 extension bundle                         |
| `pnpm --filter web dev`                 | Launch the Next.js web application                            |
