import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedJob, ScrapeResult } from '../types';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 25;

export class CryptoCurrencyJobsScraper extends BaseScraper {
  constructor() {
    super({
      name: 'cryptocurrencyjobs.co',
      baseUrl: 'https://cryptocurrencyjobs.co',
      jobListUrl: 'https://cryptocurrencyjobs.co',
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
      const listings = $(
        '.job-listing, article, .group, .card, [class*="listing"], a[href*="/jobs/"]'
      );

      let processed = 0;
      const seen = new Set<string>();

      for (const el of listings.toArray()) {
        if (processed >= MAX_JOBS) break;
        const listing = $(el);

        try {
          const isAnchor = el.tagName?.toLowerCase() === 'a';
          const titleEl = isAnchor
            ? listing.find('h2, h3, .job-title, .title, span.font-semibold, strong').first()
            : listing.find('h2, h3, .job-title, .title, a.font-semibold').first();

          let title = titleEl.text().trim();
          if (!title || title.length < 3) {
            const linkText = listing.find('a').first().text().trim();
            if (linkText && linkText.length > 3) title = linkText;
            else continue;
          }

          const href = isAnchor
            ? listing.attr('href') || ''
            : listing.find('a').first().attr('href') || '';
          const sourceUrl = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
          const sourceId = href.replace(/^\//, '').split('?')[0] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

          if (seen.has(sourceId)) continue;
          seen.add(sourceId);

          const existing = await checkJobExists(sourceId, 'cryptocurrencyjobs.co');
          if (existing) {
            console.log(`  [SKIP] Already exists: ${title}`);
            processed++;
            continue;
          }

          const companyEl = listing.find(
            '[class*="company"], .employer, .organization, .text-gray-500, .text-sm.text-gray'
          ).first();
          let companyName = companyEl.text().trim();
          if (!companyName || companyName === title) {
            companyName = listing.find('.text-xs, .text-sm')
              .not(titleEl)
              .first()
              .text()
              .trim() || 'Unknown';
          }

          const locationEl = listing.find(
            '[class*="location"], [class*="remote"], .text-gray-400'
          ).first();
          const locationText = locationEl.text().trim() || 'Remote';

          const tagEls = listing.find(
            '.tag, .badge, .category, .pill, [class*="tag"], [class*="category"], [class*="pill"]'
          );
          const tags: string[] = [];
          tagEls.each((_, t) => {
            const text = $(t).text().trim();
            if (text && text.length < 40 && !text.includes('$')) tags.push(text);
          });

          const salaryEl = listing.find('[class*="salary"], [class*="compensation"]').first();
          const salaryText = salaryEl.text().trim() || '';
          const salary = this.parseSalary(salaryText);

          const postedEl = listing.find('time, [class*="date"], [class*="time"], [datetime]').first();
          const postedDate = postedEl.text().trim() || postedEl.attr('datetime') || '';

          const description = `${title} at ${companyName}. ${tags.length ? 'Tags: ' + tags.join(', ') : ''}`;

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
            source_site: 'cryptocurrencyjobs.co',
            source_url: sourceUrl,
            source_id: sourceId,
            posted_date: postedDate,
            tags,
            categories: this.extractCategories(`${title} ${description}`, tags),
          };

          const companyId = await upsertCompany({
            name: companyName,
            source_site: 'cryptocurrencyjobs.co',
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
      '.job-listing, article, .group, .card, [class*="listing"], a[href*="/jobs/"]'
    ).each((_, el) => {
      const listing = $(el);
      const title = listing.find('h2, h3, .job-title, .title').first().text().trim();
      if (!title) return;

      const href = listing.is('a')
        ? listing.attr('href') || ''
        : listing.find('a').first().attr('href') || '';
      const tags: string[] = [];
      listing.find('.tag, .badge').each((_, t) => tags.push($(t).text().trim()));

      jobs.push({
        title,
        company_name: listing.find('[class*="company"]').first().text().trim() || 'Unknown',
        location: listing.find('[class*="location"]').first().text().trim() || 'Remote',
        is_remote: true,
        description: '',
        job_type: 'full-time',
        source_site: 'cryptocurrencyjobs.co',
        source_url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
        source_id: href.replace(/^\//, '').split('?')[0],
        tags,
        categories: [],
      });
    });

    return jobs.slice(0, MAX_JOBS);
  }

  async scrapeJobDetail(url: string): Promise<ScrapedJob> {
    const html = await this.fetchHTML(url);
    const $ = this.parseHTML(html);

    const title = $('h1, .job-title').first().text().trim() || 'Unknown';
    const company = $('[class*="company"], .employer').first().text().trim() || 'Unknown';
    const desc = $('.job-description, .description, article, main').first().text().trim();
    const tags: string[] = [];
    $('.tag, .badge, .category').each((_, t) => {
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
      source_site: 'cryptocurrencyjobs.co',
      source_url: url,
      source_id: url.replace(this.config.baseUrl, '').replace(/^\//, '').split('?')[0],
      tags,
      categories: this.extractCategories(`${title} ${desc}`, tags),
    };
  }
}
