// ============================================================
// RemoteWeb3 Spider - W3Jobs Scraper
// ============================================================
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedJob, ScrapeResult } from '../types';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_PAGES = 15;
const MAX_JOBS_PER_RUN = 200;

export class W3JobsScraper extends BaseScraper {
  constructor() {
    super({
      name: 'w3jobs.com',
      baseUrl: 'https://w3jobs.com',
      jobListUrl: 'https://w3jobs.com',
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
      let totalProcessed = 0;
      const seen = new Set<string>();

      for (let page = 1; page <= MAX_PAGES; page++) {
        if (totalProcessed >= MAX_JOBS_PER_RUN) break;

        const url = page === 1
          ? this.config.jobListUrl
          : `${this.config.jobListUrl}/jobs?page=${page}`;
        console.log(`  Page ${page}: ${url}`);

        let html: string;
        try {
          html = await this.fetchHTML(url);
        } catch {
          if (page === 1) {
            const altUrl = `${this.config.jobListUrl}/job-directory`;
            try {
              console.log(`  Trying alternate URL: ${altUrl}`);
              html = await this.fetchHTML(altUrl);
            } catch {
              console.log(`  [DONE] Could not fetch page ${page}`);
              break;
            }
          } else {
            console.log(`  [DONE] No more pages (stopped at page ${page})`);
            break;
          }
        }

        const $ = this.parseHTML(html);
        const cards = $(
          'a[href*="/job/"], a[href*="/jobs/"], .job-card, .job-listing, .job-item, article.job, [class*="job-card"], [class*="job-listing"], .listing-item, .position-card'
        ).toArray();

        if (cards.length === 0) {
          console.log(`  [DONE] No job cards on page ${page}`);
          break;
        }

        console.log(`  Found ${cards.length} cards on page ${page}`);

        let pageProcessed = 0;
        for (const el of cards) {
          if (totalProcessed >= MAX_JOBS_PER_RUN) break;

          const card = $(el);
          try {
            const isAnchor = (el as any).tagName?.toLowerCase() === 'a';
            const titleEl = isAnchor
              ? card.find('h2, h3, h4, .title, .job-title, [class*="title"]').first()
              : card.find('h2, h3, h4, .title, .job-title, [class*="title"]').first();
            const title = titleEl.text().trim();
            if (!title || title.length < 3) continue;

            const href = isAnchor
              ? card.attr('href') || ''
              : card.find('a[href*="/job/"], a[href*="/jobs/"], a').first().attr('href') || '';
            const sourceUrl = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
            const sourceId = (href || title).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 80);

            if (seen.has(sourceId)) continue;
            seen.add(sourceId);

            const existing = await checkJobExists(sourceId, 'w3jobs.com');
            if (existing) {
              console.log(`  [SKIP] Already exists: ${title}`);
              pageProcessed++;
              totalProcessed++;
              continue;
            }

            const companyEl = card.find(
              '.company, .company-name, .employer, .organization, [class*="company"], [class*="employer"]'
            ).first();
            const companyName = companyEl.text().trim() || 'Unknown';

            const locationEl = card.find(
              '.location, .job-location, [class*="location"], .remote-badge'
            ).first();
            const locationText = locationEl.text().trim() || 'Remote';

            const salaryEl = card.find(
              '.salary, .job-salary, [class*="salary"], [class*="compensation"], [class*="pay"], .salary-range'
            ).first();
            const salaryText = salaryEl.text().trim() || '';
            const salary = this.parseSalary(salaryText);

            const tagEls = card.find(
              '.tag, .badge, .category, .skill, [class*="tag"], [class*="category"], [class*="skill"]'
            );
            const tags: string[] = [];
            tagEls.each((_, t) => {
              const text = $(t).text().trim();
              if (text && text.length < 40) tags.push(text);
            });

            const descEl = card.find('.description, .excerpt, .summary, p').first();
            const description = descEl.text().trim() || `${title} at ${companyName}`;

            const allTags = [...new Set([...tags, ...this.extractTags(title, description)])];

            const job: ScrapedJob = {
              title,
              company_name: companyName,
              location: locationText,
              is_remote: locationText.toLowerCase().includes('remote'),
              salary_min: salary.min,
              salary_max: salary.max,
              salary_currency: salary.currency || 'USD',
              salary_period: 'year',
              description,
              job_type: this.mapJobType(`${title} ${description}`),
              experience_level: this.mapExperienceLevel(title),
              application_url: sourceUrl,
              source_site: 'w3jobs.com',
              source_url: sourceUrl,
              source_id: sourceId,
              tags: allTags,
              categories: this.extractCategories(description, allTags),
            };

            const companyId = await upsertCompany({
              name: companyName,
              source_site: 'w3jobs.com',
            });
            if (companyId !== null) result.companiesInserted++;

            const tagIds: number[] = [];
            for (const tag of allTags.slice(0, 10)) {
              const tagId = await upsertTag(tag, 'skill');
              if (tagId !== null) tagIds.push(tagId);
              await this.sleep(50);
            }

            if (companyId) {
              const jobId = await createJob(job, companyId, tagIds);
              if (jobId !== null) result.jobsInserted++;
            }

            console.log(`  [OK] ${title} @ ${companyName}`);
            pageProcessed++;
            totalProcessed++;
            await this.sleep(100);
          } catch (err: any) {
            result.errors.push(`Job parse error: ${err.message}`);
            console.error(`  [ERR] ${err.message}`);
            pageProcessed++;
            totalProcessed++;
          }
        }

        console.log(`  Page ${page}: ${pageProcessed} processed, total ${totalProcessed}`);

        if (totalProcessed >= MAX_JOBS_PER_RUN) break;
        if (pageProcessed === 0) break;
        await this.sleep(500);
      }

      result.jobsScraped = totalProcessed;
    } catch (err: any) {
      result.errors.push(`Scrape failed: ${err.message}`);
      console.error(`  [FAIL] ${err.message}`);
    }

    result.duration = Date.now() - start;
    return result;
  }
}
