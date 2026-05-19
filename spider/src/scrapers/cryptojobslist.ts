import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedJob, ScrapeResult } from '../types';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 25;

export class CryptoJobsListScraper extends BaseScraper {
  constructor() {
    super({
      name: 'cryptojobslist.com',
      baseUrl: 'https://cryptojobslist.com',
      jobListUrl: 'https://cryptojobslist.com',
    });
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
      const html = await this.fetchHTML(this.config.jobListUrl);
      const $ = this.parseHTML(html);
      const cards = $(
        '.job-listing, .listing-card, article.job-card, .job-item, a[href*="/job/"], a[href*="/jobs/"]'
      );

      let processed = 0;
      const seen = new Set<string>();

      for (const el of cards.toArray()) {
        if (processed >= MAX_JOBS) break;
        const card = $(el);

        try {
          const isAnchor = el.tagName?.toLowerCase() === 'a';
          const titleEl = isAnchor ? card : card.find('h2, h3, .job-title, .title').first();
          const title = titleEl.text().trim();
          if (!title || title.length < 3) continue;

          const href = isAnchor
            ? card.attr('href') || ''
            : card.find('a[href*="/job/"], a[href*="/jobs/"], a.job-link').first().attr('href') || '';
          const sourceUrl = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
          const sourceId = href.replace(/^\//, '').split('?')[0] || title.toLowerCase().replace(/\s+/g, '-');

          if (seen.has(sourceId)) continue;
          seen.add(sourceId);

          const existing = await checkJobExists(sourceId, 'cryptojobslist.com');
          if (existing) {
            console.log(`  [SKIP] Already exists: ${title}`);
            processed++;
            continue;
          }

          const companyEl = card.find(
            '.company, .company-name, .employer, [class*="company"]'
          ).first();
          const companyName =
            companyEl.text().trim() ||
            card.find('.text-sm, .text-xs, .text-gray-500, .text-gray-400')
              .first()
              .text()
              .trim() ||
            'Unknown';

          const locationEl = card.find(
            '.location, .job-location, [class*="location"]'
          ).first();
          const locationText = locationEl.text().trim() || 'Remote';

          const salaryEl = card.find(
            '.salary, .job-salary, [class*="salary"], [class*="compensation"]'
          ).first();
          const salaryText = salaryEl.text().trim() || '';
          const salary = this.parseSalary(salaryText);

          const tagEls = card.find(
            '.tag, .badge, .category, .skill, [class*="tag"], [class*="skill"]'
          );
          const tags: string[] = [];
          tagEls.each((_, t) => {
            const text = $(t).text().trim();
            if (text && text.length < 40) tags.push(text);
          });

          const postedEl = card.find(
            '.date, .posted, .time, time, [class*="date"], [class*="time"]'
          ).first();
          const postedDate = postedEl.text().trim() || '';

          const descEl = card.find('.description, .job-description, .excerpt, p').first();
          const description = descEl.text().trim() || `${title} at ${companyName}`;

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
            source_site: 'cryptojobslist.com',
            source_url: sourceUrl,
            source_id: sourceId,
            posted_date: postedDate,
            tags,
            categories: this.extractCategories(`${title} ${description}`, tags),
          };

          const companyId = await upsertCompany({
            name: companyName,
            source_site: 'cryptojobslist.com',
          });
          if (companyId !== null) result.companiesInserted++;

          const tagIds: number[] = [];
          for (const tag of tags) {
            const tagId = await upsertTag(tag, 'skill');
            if (tagId !== null) tagIds.push(tagId);
            await this.sleep(100);
          }

          const jobId = await createJob(job, companyId ?? 0, tagIds);
          if (jobId !== null) result.jobsInserted++;

          console.log(`  [OK] ${title} @ ${companyName}`);
          processed++;
          await this.sleep(200);
        } catch (err: any) {
          result.errors.push(`Job parse error: ${err.message}`);
          console.error(`  [ERR] ${err.message}`);
          processed++;
        }
      }

      result.jobsScraped = processed;
    } catch (err: any) {
      result.errors.push(`Scrape failed: ${err.message}`);
      console.error(`  [FAIL] ${err.message}`);
    }

    result.duration = Date.now() - start;
    return result;
  }

  async scrapeJobList(): Promise<ScrapedJob[]> {
    const html = await this.fetchHTML(this.config.jobListUrl);
    const $ = this.parseHTML(html);
    const jobs: ScrapedJob[] = [];

    $(
      '.job-listing, .listing-card, article.job-card, .job-item, a[href*="/job/"], a[href*="/jobs/"]'
    ).each((_, el) => {
      const card = $(el);
      const title = card.find('h2, h3, .job-title, .title').first().text().trim();
      if (!title) return;

      const href = card.is('a')
        ? card.attr('href') || ''
        : card.find('a[href*="/job/"], a[href*="/jobs/"]').first().attr('href') || '';

      jobs.push({
        title,
        company_name: card.find('.company, [class*="company"]').first().text().trim() || 'Unknown',
        location: card.find('.location, [class*="location"]').first().text().trim() || 'Remote',
        is_remote: true,
        description: '',
        job_type: 'full-time',
        source_site: 'cryptojobslist.com',
        source_url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
        source_id: href.replace(/^\//, '').split('?')[0],
        tags: [],
        categories: [],
      });
    });

    return jobs.slice(0, MAX_JOBS);
  }

  async scrapeJobDetail(url: string): Promise<ScrapedJob> {
    const html = await this.fetchHTML(url);
    const $ = this.parseHTML(html);

    const title = $('h1, .job-title').first().text().trim() || 'Unknown';
    const company = $('.company-name, .employer-name').first().text().trim() || 'Unknown';
    const desc = $('.job-description, .description, article').first().text().trim();
    const tags: string[] = [];
    $('.tag, .badge, .skill').each((_, t) => {
      const text = $(t).text().trim();
      if (text) tags.push(text);
    });

    return {
      title,
      company_name: company,
      location: 'Remote',
      is_remote: true,
      description: desc,
      job_type: 'full-time',
      source_site: 'cryptojobslist.com',
      source_url: url,
      source_id: url.replace(this.config.baseUrl, '').replace(/^\//, '').split('?')[0],
      tags,
      categories: this.extractCategories(`${title} ${desc}`, tags),
    };
  }
}
