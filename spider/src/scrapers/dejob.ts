// ============================================================
// RemoteWeb3 Spider - DeJob (Chinese Web3 Jobs) Scraper
// ============================================================
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedJob, ScrapeResult } from '../types';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_PAGES = 15;
const MAX_JOBS_PER_RUN = 200;

export class DeJobScraper extends BaseScraper {
  constructor() {
    super({
      name: 'dejob.top',
      baseUrl: 'https://www.dejob.top',
      jobListUrl: 'https://www.dejob.top',
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
          : `${this.config.jobListUrl}/page/${page}`;
        console.log(`  Page ${page}: ${url}`);

        let html: string;
        try {
          html = await this.fetchHTML(url);
        } catch {
          if (page === 1) {
            result.errors.push('Failed to fetch first page');
          } else {
            console.log(`  [DONE] No more pages (stopped at page ${page})`);
          }
          break;
        }

        const $ = this.parseHTML(html);
        const cards = $(
          'article, .post, .job-item, .job-card, .job-listing, .entry, .item, a[href*="/job/"], a[href*="/jobs/"], [class*="post"], [class*="article"], [class*="job"]'
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
              ? card.find('h1, h2, h3, h4, .title, .entry-title, .post-title, [class*="title"]').first()
              : card.find('h1, h2, h3, h4, .title, .entry-title, .post-title, [class*="title"]').first();
            const title = titleEl.text().trim();
            if (!title || title.length < 2) continue;

            const href = isAnchor
              ? card.attr('href') || ''
              : card.find('a').first().attr('href') || '';
            const sourceUrl = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
            const sourceId = (href || title).replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-').slice(0, 80);

            if (seen.has(sourceId)) continue;
            seen.add(sourceId);

            const existing = await checkJobExists(sourceId, 'dejob.top');
            if (existing) {
              console.log(`  [SKIP] Already exists: ${title}`);
              pageProcessed++;
              totalProcessed++;
              continue;
            }

            const companyEl = card.find(
              '.company, .company-name, .employer, .organization, [class*="company"], [class*="employer"], .meta-company'
            ).first();
            const companyName = companyEl.text().trim() || 'Unknown';

            const locationEl = card.find(
              '.location, .job-location, [class*="location"], .meta-location, .city'
            ).first();
            const locationText = locationEl.text().trim() || 'Remote';

            const salaryEl = card.find(
              '.salary, .job-salary, [class*="salary"], [class*="compensation"], [class*="pay"], .meta-salary'
            ).first();
            const salaryText = salaryEl.text().trim() || '';
            const salary = this.parseSalary(salaryText);

            const tagEls = card.find(
              '.tag, .badge, .category, .skill, [class*="tag"], [class*="category"], [class*="skill"], .cat-links a'
            );
            const tags: string[] = [];
            tagEls.each((_, t) => {
              const text = $(t).text().trim();
              if (text && text.length < 40) tags.push(text);
            });

            const dateEl = card.find(
              'time, .date, .posted-date, .entry-date, [class*="date"], [class*="time"], .meta-date'
            ).first();
            const postedDate = dateEl.attr('datetime') || dateEl.text().trim() || '';

            const descEl = card.find('.description, .excerpt, .summary, .entry-content, p').first();
            const description = descEl.text().trim() || `${title} at ${companyName}`;

            const allTags = [...new Set([...tags, ...this.extractTags(title, description)])];

            const job: ScrapedJob = {
              title,
              company_name: companyName,
              location: locationText,
              is_remote: locationText.toLowerCase().includes('remote') || locationText.toLowerCase().includes('远程'),
              salary_min: salary.min,
              salary_max: salary.max,
              salary_currency: salary.currency || 'USD',
              salary_period: 'year',
              description,
              job_type: this.mapJobType(`${title} ${description}`),
              experience_level: this.mapExperienceLevel(title),
              application_url: sourceUrl,
              source_site: 'dejob.top',
              source_url: sourceUrl,
              source_id: sourceId,
              posted_date: postedDate || undefined,
              tags: allTags,
              categories: this.extractCategories(description, allTags),
            };

            const companyId = await upsertCompany({
              name: companyName,
              source_site: 'dejob.top',
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
