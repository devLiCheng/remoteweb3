// ============================================================
// RemoteWeb3 Spider - Base Scraper
// ============================================================
import * as cheerio from 'cheerio';
import type { ScrapedJob } from '../types';

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  jobListUrl: string;
}

export abstract class BaseScraper {
  config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  async fetchHTML(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });
    return res.text();
  }

  parseHTML(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  abstract scrapeJobList(): Promise<ScrapedJob[]>;
  abstract scrapeJobDetail(url: string): Promise<ScrapedJob>;

  protected mapJobType(type: string): ScrapedJob['job_type'] {
    const t = type.toLowerCase();
    if (t.includes('full') || t.includes('permanent')) return 'full-time';
    if (t.includes('part')) return 'part-time';
    if (t.includes('contract') || t.includes('temporary')) return 'contract';
    if (t.includes('intern')) return 'internship';
    if (t.includes('freelance') || t.includes('gig')) return 'freelance';
    return 'full-time';
  }

  protected mapExperienceLevel(text: string): ScrapedJob['experience_level'] {
    const t = text.toLowerCase();
    if (t.includes('senior') || t.includes('sr.') || t.includes('lead') || t.includes('principal') || t.includes('staff')) return 'senior';
    if (t.includes('mid') || t.includes('intermediate')) return 'mid';
    if (t.includes('junior') || t.includes('entry') || t.includes('intern') || t.includes('graduate')) return 'entry';
    if (t.includes('director') || t.includes('vp') || t.includes('head') || t.includes('chief') || t.includes('cto') || t.includes('ceo')) return 'executive';
    if (t.includes('lead') || t.includes('manager') || t.includes('architect')) return 'lead';
    return undefined;
  }

  protected parseSalary(text: string): { min?: number; max?: number; currency?: string } {
    const cleaned = text.replace(/[^0-9.$kKmM,]/g, ' ').trim();
    const numbers = cleaned.match(/[\d,.]+[kKmM]?/g);
    if (!numbers || numbers.length === 0) return {};

    const parseVal = (s: string): number => {
      s = s.replace(/,/g, '').toLowerCase();
      if (s.endsWith('k')) return parseFloat(s) * 1000;
      if (s.endsWith('m')) return parseFloat(s) * 1000000;
      return parseFloat(s);
    };

    const vals = numbers.map(parseVal).filter((n) => n > 0);
    const currency = text.includes('$') || text.includes('USD') ? 'USD' : text.includes('€') ? 'EUR' : text.includes('£') ? 'GBP' : 'USD';

    if (vals.length >= 2) return { min: Math.min(...vals), max: Math.max(...vals), currency };
    if (vals.length === 1) return { min: vals[0], currency };
    return { currency };
  }

  protected extractTags(title: string, description: string): string[] {
    const keywords = [
      'solidity', 'rust', 'golang', 'go', 'typescript', 'javascript', 'python',
      'react', 'next.js', 'nextjs', 'node.js', 'nodejs', 'vue', 'angular',
      'ethereum', 'solana', 'polygon', 'avalanche', 'cosmos', 'polkadot',
      'defi', 'nft', 'dao', 'layer 2', 'l2', 'zero knowledge', 'zk',
      'smart contract', 'solidity', 'evm', 'web3.js', 'ethers.js',
      'aws', 'docker', 'kubernetes', 'graphql', 'rest api',
      'ai', 'machine learning', 'ml', 'data', 'analytics',
      'security', 'audit', 'testing', 'devops', 'ci/cd',
      'community', 'marketing', 'design', 'product management',
      'blockchain', 'crypto', 'web3', 'dapp', 'wallet', 'token',
    ];
    const text = `${title} ${description}`.toLowerCase();
    return keywords.filter((k) => text.includes(k));
  }

  protected extractCategories(description: string, tags: string[]): string[] {
    const categoryMap: Record<string, string> = {
      'solidity': 'engineering', 'rust': 'engineering', 'golang': 'engineering',
      'typescript': 'engineering', 'javascript': 'engineering', 'python': 'engineering',
      'react': 'engineering', 'node.js': 'engineering', 'smart contract': 'engineering',
      'devops': 'engineering', 'security': 'engineering',
      'design': 'design', 'ui': 'design', 'ux': 'design',
      'marketing': 'marketing', 'community': 'community',
      'product management': 'product',
      'defi': 'engineering', 'nft': 'engineering', 'dao': 'operations',
      'analytics': 'data-analytics', 'data': 'data-analytics',
      'content': 'writing-content', 'writer': 'writing-content',
      'sales': 'sales', 'business': 'business-development',
      'support': 'customer-support', 'customer': 'customer-support',
    };

    const text = `${description} ${tags.join(' ')}`.toLowerCase();
    const categories = new Set<string>();
    categories.add('engineering'); // Default

    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (text.includes(keyword)) {
        categories.add(category);
      }
    }
    return Array.from(categories);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
