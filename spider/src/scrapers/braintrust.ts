// ============================================================
// RemoteWeb3 Spider - Braintrust Scraper
// ============================================================
import * as cheerio from 'cheerio';
import type { ScrapedJob, ScrapeResult } from '../types';
import { BaseScraper } from './base';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 15;

export class BraintrustScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Braintrust',
      baseUrl: 'https://www.usebraintrust.com',
      jobListUrl: 'https://www.usebraintrust.com/talent/engineering?category=web3',
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

      const cards = $(
        '.job-card, .job-listing, [data-testid="job-card"], article[class*="job"], .position-card, .talent-card, .listing-card, a[href*="/job/"]'
      )
        .toArray()
        .filter((el, idx, arr) => {
          const $el = $(el);
          const title = $el.find('h2, h3, h4, .title, .job-title, [class*="title"]').first().text().trim();
          return !!title && title.length > 2;
        });

      console.log(`  [${this.config.name}] Found ${cards.length} job cards on page`);

      let processed = 0;
      for (const card of cards) {
        if (processed >= MAX_JOBS) break;

        try {
          const $card = $(card);

          const titleEl = $card.find('h2, h3, h4, .title, .job-title, [class*="title"]').first();
          const title = titleEl.text().trim();

          const companyEl = $card.find('.company, .employer, .organization, [class*="company"]').first();
          const companyName = companyEl.text().trim();

          const linkEl = $card.is('a') ? $card : $card.find('a[href*="/job/"], a[href*="/position/"], a').first();
          const jobPath = linkEl.attr('href') || '';
          const sourceUrl = jobPath.startsWith('http')
            ? jobPath
            : `${this.config.baseUrl}${jobPath}`;

          const locationEl = $card.find('.location, .remote, [class*="location"]');
          const location = locationEl.text().trim() || 'Remote';

          const typeEl = $card.find('.type, .employment-type, [class*="type"], .job-type');
          const typeText = typeEl.text().trim();

          const payEl = $card.find('.pay, .salary, .rate, .compensation, [class*="pay"], [class*="salary"], [class*="rate"]');
          const salaryText = payEl.text().trim();

          const skillsEls = $card.find('.skill, .tag, .badge, [class*="skill"], [class*="tech"]');
          const skillsText = skillsEls.map((_, el) => $(el).text().trim()).get().join(' ');

          const descEl = $card.find('.description, p, [class*="desc"], [class*="summary"]').first();
          const description = descEl.text().trim();

          if (!title) continue;

          const sourceId = (jobPath || title).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 80);
          const jobType = this.mapJobType(typeText);
          const salary = this.parseSalary(salaryText);
          const tags = this.extractTags(title, skillsText + ' ' + description);
          const categories = this.extractCategories(description, tags);

          const job: ScrapedJob = {
            title,
            company_name: companyName || 'Unknown',
            location,
            is_remote: location.toLowerCase().includes('remote'),
            salary_min: salary.min,
            salary_max: salary.max,
            salary_currency: salary.currency,
            description: description || skillsText,
            job_type: jobType,
            application_url: sourceUrl,
            source_site: 'usebraintrust.com',
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
            source_site: 'usebraintrust.com',
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

          console.log(`  [${this.config.name}] [${processed + 1}/${Math.min(cards.length, MAX_JOBS)}] ${title} @ ${companyName || 'Unknown'}`);
          processed++;
          await this.sleep(100);
        } catch (err: any) {
          result.errors.push(`Card ${processed}: ${err.message}`);
          console.error(`  [WARN] Error processing card: ${err.message}`);
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
