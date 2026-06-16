#!/usr/bin/env node

'use strict';

const RSSParser  = require('rss-parser');
const chalk      = require('chalk');
const Table      = require('cli-table3');
const cron       = require('node-cron');
const notifier   = require('node-notifier');
const path       = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────
const FEEDS = [
  {
    label : 'Top Stories',
    url   : 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    emoji : '🌍',
  },
  {
    label : 'World',
    url   : 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    emoji : '🌐',
  },
  {
    label : 'Technology',
    url   : 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    emoji : '💻',
  },
  {
    label : 'Business',
    url   : 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    emoji : '💼',
  },
];

const MAX_ITEMS_PER_FEED = 5;   // articles shown per category
const INTERVAL_MINUTES   = 30;  // refresh interval

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parser = new RSSParser();

function now() {
  return new Date().toLocaleString('en-US', {
    dateStyle : 'medium',
    timeStyle : 'medium',
  });
}

function truncate(str, max = 80) {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

function formatAge(pubDate) {
  if (!pubDate) return chalk.gray('unknown');
  const diff = Date.now() - new Date(pubDate).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return chalk.green('just now');
  if (mins < 60)  return chalk.green(`${mins}m ago`);
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return chalk.yellow(`${hrs}h ago`);
  return chalk.red(`${Math.floor(hrs / 24)}d ago`);
}

function printBanner() {
  const line = '═'.repeat(78);
  console.log('\n' + chalk.cyan(line));
  console.log(
    chalk.cyan('║') +
    chalk.bold.white('  📰  GOOGLE NEWS LIVE FEED') +
    chalk.gray(`   —   refreshes every ${INTERVAL_MINUTES} min   —   `) +
    chalk.dim(`${now()}`) +
    chalk.cyan('  ║')
  );
  console.log(chalk.cyan(line) + '\n');
}

// ─── Core: fetch one feed ─────────────────────────────────────────────────────
async function fetchFeed({ label, url, emoji }) {
  try {
    const feed  = await parser.parseURL(url);
    const items = feed.items.slice(0, MAX_ITEMS_PER_FEED);

    // Section header
    console.log(
      chalk.bold.bgBlue.white(` ${emoji}  ${label.toUpperCase()} `) +
      chalk.dim(` — ${items.length} articles`)
    );
    console.log(chalk.dim('─'.repeat(78)));

    const table = new Table({
      head    : [
        chalk.bold.cyan('#'),
        chalk.bold.cyan('Headline'),
        chalk.bold.cyan('Source'),
        chalk.bold.cyan('Age'),
      ],
      colWidths : [4, 62, 16, 12],
      style     : { border: ['gray'], head: [] },
      wordWrap  : true,
    });

    items.forEach((item, i) => {
      const source = item.source?.title ||
                     (item.creator ? item.creator : feed.title) ||
                     'Google News';
      table.push([
        chalk.white(i + 1),
        chalk.white(item.title || ''),
        chalk.yellow(truncate(source, 14)),
        formatAge(item.pubDate || item.isoDate),
      ]);
    });

    console.log(table.toString());
    console.log();

    return items;
  } catch (err) {
    console.log(chalk.red(`  ✖  Failed to fetch "${label}": ${err.message}\n`));
    return [];
  }
}

// ─── Core: fetch ALL feeds ────────────────────────────────────────────────────
async function fetchAllNews() {
  printBanner();
  let totalCount = 0;

  for (const feed of FEEDS) {
    const items = await fetchFeed(feed);
    totalCount += items.length;
  }

  const nextRun = new Date(Date.now() + INTERVAL_MINUTES * 60 * 1000);
  console.log(
    chalk.dim('─'.repeat(78)) + '\n' +
    chalk.gray(`  ✔  Fetched ${totalCount} articles total.`) +
    chalk.gray(`  Next refresh: `) +
    chalk.cyan(nextRun.toLocaleTimeString()) + '\n' +
    chalk.dim('  Press ') + chalk.bold('Ctrl+C') + chalk.dim(' to stop.\n')
  );

  // Windows toast notification
  notifier.notify({
    title   : '📰 Google News Refreshed',
    message : `Fetched ${totalCount} articles across ${FEEDS.length} categories.\nNext refresh at ${nextRun.toLocaleTimeString()}.`,
    appID   : 'Google News Watcher',
    icon    : path.join(__dirname, 'icon.png'),
    sound   : false,
    wait    : false,
  });
}

// ─── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  console.clear();
  console.log(chalk.bold.green('\n  ▶  Google News Watcher starting…\n'));

  // Fetch immediately on start
  await fetchAllNews();

  // Then schedule every 30 minutes via cron
  const cronExpr = `*/${INTERVAL_MINUTES} * * * *`;
  cron.schedule(cronExpr, async () => {
    console.clear();
    await fetchAllNews();
  });

  console.log(
    chalk.dim(`  ⏰  Scheduled: runs every ${INTERVAL_MINUTES} minutes (cron: "${cronExpr}")\n`)
  );
}

main().catch(err => {
  console.error(chalk.red('\n  Fatal error:'), err.message);
  process.exit(1);
});
