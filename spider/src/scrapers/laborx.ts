// ============================================================
// RemoteWeb3 Spider - LaborX Scraper
// ============================================================
import * as cheerio from 'cheerio';
import type { ScrapedJob, ScrapeResult } from '../types';
import { BaseScraper } from './base';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 20;

export class LaborXScraper extends BaseScraper {
  constructor() {
    super({
      name: 'LaborX',
      baseUrl: 'https://laborx.com',
      jobListUrl: 'https://laborx.com/jobs/c/web-development-it',
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
        '.job-item, .gig-item, .project-item, .job-listing, [data-testid="job-item"], .job-card, article[class*="job"], .listing-row, .job-row'
      ).toArray();

      console.log(`  [${this.config.name}] Found ${listings.length} job listings on page`);

      let processed = 0;
      for (const listing of listings) {
        if (processed >= MAX_JOBS) break;

        try {
          const $listing = $(listing);

          const titleEl = $listing.find('h2, h3, h4, .title, .job-title, [class*="title"], a[class*="title"]').first();
          const title = titleEl.text().trim();

          const linkEl = $listing.find('a[href*="/job/"], a[href*="/gig/"], a[href*="/project/"], a[class*="title"]').first();
          const jobPath = linkEl.attr('href') || '';
          const sourceUrl = jobPath.startsWith('http')
            ? jobPath
            : `${this.config.baseUrl}${jobPath}`;

          const companyEl = $listing.find('.employer, .company, .client, .posted-by, [class*="employer"], [class*="client"]').first();
          const companyName = companyEl.text().trim();

          const budgetEl = $listing.find('.budget, .price, .salary, .rate, .compensation, [class*="budget"], [class*="price"], [class*="amount"]').first();
          const salaryText = budgetEl.text().trim();

          const skillsEls = $listing.find('.skill, .tag, .category, .badge, [class*="skill"], [class*="tag"]');
          const skillsText = skillsEls.map((_, el) => $(el).text().trim()).get().join(' ');

          const dateEl = $listing.find('.date, .posted, .time, time, [class*="date"], [class*="posted"], [class*="created"]').first();
          const postedDate = dateEl.attr('datetime') || dateEl.text().trim();

          const descEl = $listing.find('.description, p, [class*="desc"], [class*="brief"]').first();
          const description = descEl.text().trim();

          if (!title) continue;

          const sourceId = (jobPath || title).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 80);
          const salary = this.parseSalary(salaryText);
          const tags = this.extractTags(title, skillsText + ' ' + description);
          const categories = this.extractCategories(description, tags);

          const job: ScrapedJob = {
            title,
            company_name: companyName || 'Unknown',
            location: 'Remote',
            is_remote: true,
            salary_min: salary.min,
            salary_max: salary.max,
            salary_currency: salary.currency,
            description: description || skillsText,
            job_type: this.mapJobType(skillsText),
            application_url: sourceUrl,
            source_site: 'laborx.com',
            source_url: sourceUrl,
            source_id: sourceId,
            posted_date: postedDate || undefined,
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
            source_site: 'laborx.com',
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
