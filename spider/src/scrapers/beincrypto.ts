// ============================================================
// RemoteWeb3 Spider - BeInCrypto Jobs Scraper
// ============================================================
import * as cheerio from 'cheerio';
import type { ScrapedJob, ScrapeResult } from '../types';
import { BaseScraper } from './base';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 20;

export class BeInCryptoScraper extends BaseScraper {
  constructor() {
    super({
      name: 'BeInCrypto',
      baseUrl: 'https://beincrypto.com',
      jobListUrl: 'https://beincrypto.com/jobs/',
    });
  }

  async scrapeJobList(): Promise<ScrapedJob[]> {
    return [];
  }

  async scrapeJobDetail(url: string): Promise<ScrapedJob> {
    throw new Error('Not implemented');
  }

  async scrape(): Promise<ScrapeResult> {
    const start = Date.now();
    const result: ScrapeResult = {
      site: this.config.name,
      jobsScraped: 0,
      jobsInserted: 0,
      companiesInserted: 0,
      errors: [],
      duration: 0,
    };

    try {
      console.log(`  [${this.config.name}] Fetching ${this.config.jobListUrl} ...`);
      const html = await this.fetchHTML(this.config.jobListUrl);
      const $ = this.parseHTML(html);

      const listings = $(
        '.job-listing, .job-item, .job-card, [class*="job-listing"], [class*="job-card"], article.job, .listing, .vacancy-card, .job-row, li[class*="job"]'
      ).toArray();

      console.log(`  [${this.config.name}] Found ${listings.length} job listings on page`);

      let processed = 0;
      for (const listing of listings) {
        if (processed >= MAX_JOBS) break;

        try {
          const $listing = $(listing);

          const titleEl = $listing.find('h2, h3, h4, .title, .job-title, [class*="title"] a, a[class*="title"]').first();
          const title = titleEl.text().trim();

          const linkEl = $listing.find('a[href*="/job/"], a[href*="/jobs/"], a[class*="title"]').first();
          const jobPath = linkEl.attr('href') || '';
          const sourceUrl = jobPath.startsWith('http')
            ? jobPath
            : `${this.config.baseUrl}${jobPath}`;

          const companyEl = $listing.find('.company, .employer, .organization, [class*="company"], [class*="employer"]').first();
          const companyName = companyEl.text().trim();

          const locationEl = $listing.find('.location, .remote, [class*="location"]');
          const location = locationEl.text().trim() || 'Remote';

          const typeEl = $listing.find('.type, .job-type, .employment-type, [class*="type"]');
          const typeText = typeEl.text().trim();

          const tagsEls = $listing.find('.tag, .category, .badge, .skill, .job-tag, [class*="tag"], [class*="category"]');
          const tagsText = tagsEls.map((_, el) => $(el).text().trim()).get().join(' ');

          const descEl = $listing.find('.description, p, .excerpt, [class*="desc"], [class*="summary"]').first();
          const description = descEl.text().trim();

          if (!title) continue;

          const sourceId = (jobPath || title).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 80);
          const tags = this.extractTags(title, tagsText + ' ' + description);
          const categories = this.extractCategories(description, tags);

          const job: ScrapedJob = {
            title,
            company_name: companyName || 'Unknown',
            location,
            is_remote: location.toLowerCase().includes('remote'),
            description: description || tagsText,
            job_type: this.mapJobType(typeText),
            application_url: sourceUrl,
            source_site: 'beincrypto.com',
            source_url: sourceUrl,
            source_id: sourceId,
            tags,
            categories,
          };

          const exists = await checkJobExists(job.source_id, job.source_site);
          if (exists) {
            console.log(`  [${this.config.name}] SKIP (exists): ${title}`);
            processed++;
            continue;
          }

          const companyId = await upsertCompany({
            name: companyName || 'Unknown',
            source_site: 'beincrypto.com',
          });
          if (companyId) result.companiesInserted++;

          const tagIds: number[] = [];
          for (const tag of tags) {
            const tagId = await upsertTag(tag, 'skill');
            if (tagId) tagIds.push(tagId);
            await this.sleep(100);
          }

          if (companyId) {
            const jobId = await createJob(job, companyId, tagIds);
            if (jobId) result.jobsInserted++;
          }

          console.log(`  [${this.config.name}] [${processed + 1}/${Math.min(listings.length, MAX_JOBS)}] ${title} @ ${companyName || 'Unknown'}`);
          processed++;
          await this.sleep(100);
        } catch (err: any) {
          result.errors.push(`Listing ${processed}: ${err.message}`);
          console.error(`  [WARN] Error processing listing: ${err.message}`);
        }
      }

      result.jobsScraped = processed;
    } catch (err: any) {
      result.errors.push(`Fetch error: ${err.message}`);
      console.error(`  [ERROR] ${err.message}`);
    }

    result.duration = Date.now() - start;
    return result;
  }
}
