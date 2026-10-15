# Turkish Media

Team task board for a software company (browser-only, local data): **assign tasks to team members**, filter by person or project, track status, deadlines, and attachments.

Data stays on your device in **IndexedDB** (no account or server required).

## Requirements

- Node.js 20+

## Run locally

**One command (macOS opens the browser automatically):**

```bash
cd ~/Documents/MacTaskPlanner
./run.sh
```

Or manually:

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

Allow browser notifications if you use **Notify at deadline**.

## Build for production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

## Features

- **Projects** — create, edit, delete, color labels
- **Tasks** — search, smart lists (Today, Overdue, status filters)
- **Details** — description, deadline, images (drag-and-drop or upload)
- **Team sidebar** — **All team tasks**, each **person’s queue** (open count), or **by project**
- **My tasks** — set **I am** to your name, then use **My tasks** for your assignments
- **Assign task** — admin flow: title, **required assignee**, project, status
- **Themes** — light and dark mode (sidebar toggle; preference is saved)
- **Shortcuts** — `⌘N` / `Ctrl+N` new task
