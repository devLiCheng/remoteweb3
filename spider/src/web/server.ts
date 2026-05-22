import { Hono } from 'hono';
import type { ScrapeResult } from '../types';
import { Web3CareerScraper } from '../scrapers/web3career';
import { CryptoJobsListScraper } from '../scrapers/cryptojobslist';
import { CryptoCurrencyJobsScraper } from '../scrapers/cryptocurrencyjobs';
import { Remote3Scraper } from '../scrapers/remote3';
import { WellfoundScraper } from '../scrapers/wellfound';
import { Web3JobsScraper } from '../scrapers/web3jobs';
import { BraintrustScraper } from '../scrapers/braintrust';
import { LaborXScraper } from '../scrapers/laborx';
import { BeInCryptoScraper } from '../scrapers/beincrypto';
import { FindWeb3Scraper } from '../scrapers/findweb3';
import { HashtagWeb3Scraper } from '../scrapers/hashtagweb3';
import { W3JobsScraper } from '../scrapers/w3jobs';
import { DeJobScraper } from '../scrapers/dejob';
import { EthereumJobsScraper } from '../scrapers/ethereumjobs';
import { SolanaJobsScraper } from '../scrapers/solanajobs';
import { readFileSync } from 'fs';
import { join } from 'path';

const scrapers = [
  { instance: new Web3CareerScraper(), key: 'web3career' },
  { instance: new CryptoJobsListScraper(), key: 'cryptojobslist' },
  { instance: new CryptoCurrencyJobsScraper(), key: 'cryptocurrencyjobs' },
  { instance: new Remote3Scraper(), key: 'remote3' },
  { instance: new WellfoundScraper(), key: 'wellfound' },
  { instance: new Web3JobsScraper(), key: 'web3jobs' },
  { instance: new BraintrustScraper(), key: 'braintrust' },
  { instance: new LaborXScraper(), key: 'laborx' },
  { instance: new BeInCryptoScraper(), key: 'beincrypto' },
  { instance: new FindWeb3Scraper(), key: 'findweb3' },
  { instance: new HashtagWeb3Scraper(), key: 'hashtagweb3' },
  { instance: new W3JobsScraper(), key: 'w3jobs' },
  { instance: new DeJobScraper(), key: 'dejob' },
  { instance: new EthereumJobsScraper(), key: 'ethereumjobs' },
  { instance: new SolanaJobsScraper(), key: 'solanajobs' },
];

type RunStatus = 'idle' | 'running' | 'done' | 'error';
const runningStatus: Map<string, { status: RunStatus; result?: ScrapeResult; error?: string; log: string[] }> = new Map();

function dashboardHTML() {
  try {
    return readFileSync(join(import.meta.dir, 'dashboard.html'), 'utf-8');
  } catch {
    return '<h1>Dashboard not found</h1>';
  }
}

const app = new Hono();

// --- Health Check ---
app.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));

// --- API Routes ---
app.get('/api/spider/scrapers', (c) => {
  return c.json(
    scrapers.map((s) => ({
      key: s.key,
      name: s.instance.config.name,
      baseUrl: s.instance.config.baseUrl,
      status: runningStatus.get(s.key)?.status || 'idle',
    }))
  );
});

app.post('/api/spider/run/:key', async (c) => {
  const key = c.req.param('key');
  const scraper = scrapers.find((s) => s.key === key);
  if (!scraper) return c.json({ error: 'Scraper not found' }, 404);

  const current = runningStatus.get(key);
  if (current?.status === 'running') {
    return c.json({ error: 'Already running' }, 409);
  }

  const state = { status: 'running' as RunStatus, log: [] as string[] };
  runningStatus.set(key, state);

  try {
    const result = await scraper.instance.scrape();
    state.status = 'done';
    state.result = result;
    state.log.push(`Completed: ${result.jobsScraped} scraped, ${result.jobsInserted} inserted`);
  } catch (err: any) {
    state.status = 'error';
    state.error = err.message;
    state.log.push(`Error: ${err.message}`);
  }

  return c.json(state);
});

app.get('/api/spider/status/:key', (c) => {
  const key = c.req.param('key');
  const state = runningStatus.get(key);
  return c.json(state || { status: 'idle', log: [] });
});

// run-all supports both GET (browser) and POST (dashboard button)
const runAllHandler = async (c: any) => {
  const results: Record<string, any> = {};
  for (const s of scrapers) {
    const current = runningStatus.get(s.key);
    if (current?.status === 'running') continue;
    const state = { status: 'running' as RunStatus, log: [] as string[] };
    runningStatus.set(s.key, state);
    try {
      const result = await s.instance.scrape();
      state.status = 'done';
      state.result = result;
      results[s.key] = { jobs: result.jobsScraped, inserted: result.jobsInserted };
    } catch (err: any) {
      state.status = 'error';
      state.error = err.message;
      results[s.key] = { error: err.message };
    }
  }
  return c.json(results);
};

app.get('/api/spider/run-all', runAllHandler);
app.post('/api/spider/run-all', runAllHandler);

// --- Static Pages ---
app.get('/', (c) => c.html(dashboardHTML()));
app.get('/dashboard.html', (c) => c.html(dashboardHTML()));

// Catch-all: return JSON 404 (never HTML for /api paths)
app.all('*', (c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.html(dashboardHTML());
});

export default {
  port: parseInt(process.env.PORT || '3001'),
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
