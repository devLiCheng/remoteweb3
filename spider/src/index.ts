// ============================================================
// RemoteWeb3 Spider - Main Orchestrator
// ============================================================
import type { ScrapeResult } from './types';
import { Web3CareerScraper } from './scrapers/web3career';
import { CryptoJobsListScraper } from './scrapers/cryptojobslist';
import { CryptoCurrencyJobsScraper } from './scrapers/cryptocurrencyjobs';
import { Remote3Scraper } from './scrapers/remote3';
import { WellfoundScraper } from './scrapers/wellfound';
import { Web3JobsScraper } from './scrapers/web3jobs';
import { BraintrustScraper } from './scrapers/braintrust';
import { LaborXScraper } from './scrapers/laborx';
import { BeInCryptoScraper } from './scrapers/beincrypto';
import { FindWeb3Scraper } from './scrapers/findweb3';
import { HashtagWeb3Scraper } from './scrapers/hashtagweb3';
import { W3JobsScraper } from './scrapers/w3jobs';
import { DeJobScraper } from './scrapers/dejob';
import { EthereumJobsScraper } from './scrapers/ethereumjobs';
import { SolanaJobsScraper } from './scrapers/solanajobs';

const scrapers = [
  new Web3CareerScraper(),
  new CryptoJobsListScraper(),
  new CryptoCurrencyJobsScraper(),
  new Remote3Scraper(),
  new WellfoundScraper(),
  new Web3JobsScraper(),
  new BraintrustScraper(),
  new LaborXScraper(),
  new BeInCryptoScraper(),
  new FindWeb3Scraper(),
  new HashtagWeb3Scraper(),
  new W3JobsScraper(),
  new DeJobScraper(),
  new EthereumJobsScraper(),
  new SolanaJobsScraper(),
];

async function runScraper(scraper: any, index: number, total: number): Promise<ScrapeResult> {
  const start = Date.now();
  const name = scraper.config.name;
  console.log(`\n[${index + 1}/${total}] ${name} - Starting...`);

  try {
    const result = await scraper.scrape();
    result.duration = Date.now() - start;
    console.log(`  [OK] Jobs: ${result.jobsScraped} scraped, ${result.jobsInserted} inserted, ${result.companiesInserted} companies`);
    if (result.errors.length > 0) {
      console.log(`  [WARN] ${result.errors.length} errors:`);
      result.errors.slice(0, 3).forEach((e) => console.log(`    - ${e}`));
    }
    return result;
  } catch (err: any) {
    console.log(`  [FAIL] ${err.message}`);
    return {
      site: name,
      jobsScraped: 0,
      jobsInserted: 0,
      companiesInserted: 0,
      errors: [err.message],
      duration: Date.now() - start,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const siteFilter = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;
  const allMode = args.includes('--all');

  console.log('╔══════════════════════════════════════╗');
  console.log('║   RemoteWeb3 Spider - Web3 Jobs     ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`  Sites configured: ${scrapers.length}`);
  console.log(`  API: ${process.env.API_BASE || 'http://localhost:3000'}`);
  console.log('');

  let targets = scrapers;
  if (siteFilter) {
    targets = scrapers.filter((s) => s.config.name.toLowerCase().includes(siteFilter.toLowerCase()));
    if (targets.length === 0) {
      console.log(`No scraper found matching "${siteFilter}"`);
      console.log('Available: ' + scrapers.map((s) => s.config.name).join(', '));
      process.exit(1);
    }
    console.log(`Running single scraper: ${targets[0].config.name}`);
  } else if (!allMode) {
    // Default: run first 5
    targets = scrapers.slice(0, 5);
    console.log('Running top 5 scrapers (use --all to run all)');
  }

  const results: ScrapeResult[] = [];
  for (let i = 0; i < targets.length; i++) {
    const result = await runScraper(targets[i], i, targets.length);
    results.push(result);
    // Wait between scrapers to be polite
    if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 2000));
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('  SCRAPE SUMMARY');
  console.log('═══════════════════════════════════════');
  const totalJobs = results.reduce((s, r) => s + r.jobsScraped, 0);
  const totalInserted = results.reduce((s, r) => s + r.jobsInserted, 0);
  const totalCompanies = results.reduce((s, r) => s + r.companiesInserted, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);
  const totalTime = results.reduce((s, r) => s + r.duration, 0);

  console.log(`  Sites processed: ${results.length}`);
  console.log(`  Jobs scraped:    ${totalJobs}`);
  console.log(`  Jobs inserted:   ${totalInserted}`);
  console.log(`  Companies:       ${totalCompanies}`);
  console.log(`  Errors:          ${totalErrors}`);
  console.log(`  Duration:        ${(totalTime / 1000).toFixed(1)}s`);
  console.log('═══════════════════════════════════════');

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
