# 📰 Google News Watcher

A Node.js CLI application that fetches the latest Google News headlines every **30 minutes** directly in your terminal.

## Features

- 🌍 Covers **4 categories**: Top Stories, World, Technology, Business
- ⏰ Auto-refreshes every **30 minutes** using cron scheduling
- 🎨 Beautiful, color-coded terminal output with tables
- 📅 Shows article age (e.g. "5m ago", "2h ago")
- 🔄 Fetches immediately on startup, then on schedule

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Run the watcher
npm start
```

Or directly:

```bash
node index.js
```

## Output Example

```
══════════════════════════════════════════════
  📰  GOOGLE NEWS LIVE FEED  —  Jun 16, 2026
══════════════════════════════════════════════

 🌍  TOP STORIES  — 5 articles
┌───┬──────────────────────────────────────┬──────────────┬──────────┐
│ # │ Headline                             │ Source       │ Age      │
├───┼──────────────────────────────────────┼──────────────┼──────────┤
│ 1 │ Trump and Iran reach peace deal…     │ CNN          │ 2h ago   │
└───┴──────────────────────────────────────┴──────────────┴──────────┘
```

## Configuration

Edit `index.js` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_ITEMS_PER_FEED` | `5` | Articles shown per category |
| `INTERVAL_MINUTES` | `30` | How often to refresh |

## Stop the App

Press **Ctrl+C** to stop.
