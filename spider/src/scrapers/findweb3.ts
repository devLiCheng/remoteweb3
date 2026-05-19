// ============================================================
// RemoteWeb3 Spider - FindWeb3 Scraper
// ============================================================
import * as cheerio from 'cheerio';
import type { ScrapedJob, ScrapeResult } from '../types';
import { BaseScraper } from './base';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 20;

export class FindWeb3Scraper extends BaseScraper {
  constructor() {
    super({
      name: 'FindWeb3',
      baseUrl: 'https://findweb3.com',
      jobListUrl: 'https://findweb3.com/jobs',
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
        '.job-card, .job-listing, .job-item, [class*="job-card"], [class*="job-listing"], a[href*="/job/"], .listing, article[class*="job"], .card-job, .job-entry'
      ).toArray();

      console.log(`  [${this.config.name}] Found ${listings.length} job listings on page`);

      let processed = 0;
      for (const listing of listings) {
        if (processed >= MAX_JOBS) break;

        try {
          const $listing = $(listing);

          const titleEl = $listing.find('h2, h3, h4, .title, .job-title, [class*="title"], .job-name').first();
          const title = titleEl.text().trim();

          const linkEl = $listing.is('a') ? $listing : $listing.find('a[href*="/job/"], a[href*="/jobs/"], a').first();
          const jobPath = linkEl.attr('href') || '';
          const sourceUrl = jobPath.startsWith('http')
            ? jobPath
            : `${this.config.baseUrl}${jobPath}`;

          const companyEl = $listing.find('.company, .employer, .org, .organization, [class*="company"], [class*="org"]').first();
          const companyLogo = $listing.find('.company-logo img, .logo img, [class*="logo"] img, img.avatar, .avatar img').first();
          const companyName = companyEl.text().trim();
          const logoUrl = companyLogo.attr('src') || undefined;

          const locationEl = $listing.find('.location, .remote, [class*="location"]');
          const location = locationEl.text().trim() || 'Remote';

          const typeEl = $listing.find('.type, .job-type, .employment-type, [class*="type"]');
          const typeText = typeEl.text().trim();

          const salaryEl = $listing.find('.salary, .compensation, .pay, [class*="salary"], [class*="pay"], [class*="comp"]');
          const salaryText = salaryEl.text().trim();

          const tagsEls = $listing.find('.tag, .badge, .skill, .category, .tech-stack span, [class*="tag"], [class*="skill"]');
          const tagsText = tagsEls.map((_, el) => $(el).text().trim()).get().join(' ');

          const descEl = $listing.find('.description, p, .summary, [class*="desc"], [class*="summary"], [class*="excerpt"]').first();
          const description = descEl.text().trim();

          if (!title) continue;

          const sourceId = (jobPath || title).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 80);
          const salary = this.parseSalary(salaryText);
          const tags = this.extractTags(title, tagsText + ' ' + description);
          const categories = this.extractCategories(description, tags);

          const job: ScrapedJob = {
            title,
            company_name: companyName || 'Unknown',
            company_logo: logoUrl,
            location,
            is_remote: location.toLowerCase().includes('remote'),
            salary_min: salary.min,
            salary_max: salary.max,
            salary_currency: salary.currency,
            description: description || tagsText,
            job_type: this.mapJobType(typeText),
            application_url: sourceUrl,
            source_site: 'findweb3.com',
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
            logo_url: logoUrl,
            source_site: 'findweb3.com',
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
