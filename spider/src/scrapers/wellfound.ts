import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedJob, ScrapeResult } from '../types';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 25;

export class WellfoundScraper extends BaseScraper {
  constructor() {
    super({
      name: 'wellfound.com',
      baseUrl: 'https://wellfound.com',
      jobListUrl: 'https://wellfound.com/jobs?category=web3',
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
        '.job-listing, .job-card, [data-testid="job-card"], .startup-job, .JobListing, [class*="job-listing"], [class*="jobCard"], a[href*="/jobs/"], a[href*="/recruiting/"]'
      );

      let processed = 0;
      const seen = new Set<string>();

      for (const el of cards.toArray()) {
        if (processed >= MAX_JOBS) break;
        const card = $(el);

        try {
          const isAnchor = el.tagName?.toLowerCase() === 'a';
          const titleEl = isAnchor
            ? card.find('h2, h3, .job-title, .title, span.font-semibold, span.font-bold, strong').first()
            : card.find('h2, h3, .job-title, .title, a.font-semibold, a.font-bold').first();

          let title = titleEl.text().trim();
          if (!title || title.length < 3) {
            const linkText = card.find('a').first().text().trim();
            if (linkText && linkText.length > 3) title = linkText;
            else continue;
          }

          const href = isAnchor
            ? card.attr('href') || ''
            : card.find('a').first().attr('href') || '';
          const sourceUrl = href.startsWith('http')
            ? href
            : href.startsWith('//')
              ? `https:${href}`
              : `${this.config.baseUrl}${href}`;
          const sourceId = href.replace(/^\//, '').split('?')[0] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

          if (seen.has(sourceId)) continue;
          seen.add(sourceId);

          const existing = await checkJobExists(sourceId, 'wellfound.com');
          if (existing) {
            console.log(`  [SKIP] Already exists: ${title}`);
            processed++;
            continue;
          }

          const logoEl = card.find('img[class*="logo"], img[class*="avatar"], img[src*="logo"]').first();
          const companyLogo = logoEl.attr('src') || '';

          const companyEl = card.find(
            '[class*="company"], [class*="startup"], .employer-name, .text-gray-500'
          ).first();
          let companyName = companyEl.text().trim();
          if (!companyName || companyName === title) {
            companyName = card.find('.text-sm, .text-xs')
              .not(titleEl)
              .first()
              .text()
              .trim() || 'Unknown';
          }

          const locationEl = card.find(
            '[class*="location"], [class*="remote"]'
          ).first();
          const locationText = locationEl.text().trim() || 'Remote';

          const salaryEl = card.find(
            '[class*="salary"], [class*="compensation"], [class*="equity"]'
          ).first();
          const salaryText = salaryEl.text().trim() || '';
          const salary = this.parseSalary(salaryText);

          const jobTypeEl = card.find(
            '[class*="job-type"], [class*="employment"], [class*="commitment"]'
          ).first();
          const jobTypeText = jobTypeEl.text().trim() || '';

          const descEl = card.find('[class*="description"], [class*="pitch"], p').first();
          const description = descEl.text().trim() || `${title} at ${companyName}`;

          const tags: string[] = [];
          card.find('[class*="tag"], [class*="skill"], [class*="badge"], [class*="pill"]').each((_, t) => {
            const text = $(t).text().trim();
            if (text && text.length < 40) tags.push(text);
          });

          const job: ScrapedJob = {
            title,
            company_name: companyName,
            company_logo: companyLogo || undefined,
            location: locationText,
            is_remote: locationText.toLowerCase().includes('remote'),
            salary_min: salary.min,
            salary_max: salary.max,
            salary_currency: salary.currency || 'USD',
            salary_period: 'year',
            description,
            job_type: jobTypeText ? this.mapJobType(jobTypeText) : this.mapJobType(title),
            experience_level: this.mapExperienceLevel(title),
            source_site: 'wellfound.com',
            source_url: sourceUrl,
            source_id: sourceId,
            tags,
            categories: this.extractCategories(`${title} ${description}`, tags),
          };

          const companyId = await upsertCompany({
            name: companyName,
            logo_url: companyLogo || undefined,
            source_site: 'wellfound.com',
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
      '.job-listing, .job-card, [data-testid="job-card"], [class*="job-listing"], [class*="jobCard"], a[href*="/jobs/"], a[href*="/recruiting/"]'
    ).each((_, el) => {
      const card = $(el);
      const title = card.find('h2, h3, .job-title, .title').first().text().trim();
      if (!title) return;

      const href = card.is('a')
        ? card.attr('href') || ''
        : card.find('a').first().attr('href') || '';

      jobs.push({
        title,
        company_name: card.find('[class*="company"]').first().text().trim() || 'Unknown',
        company_logo: card.find('img[class*="logo"]').first().attr('src') || '',
        location: card.find('[class*="location"]').first().text().trim() || 'Remote',
        is_remote: true,
        description: '',
        job_type: 'full-time',
        source_site: 'wellfound.com',
        source_url: href.startsWith('http') ? href : `https://wellfound.com${href}`,
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

    const title = $('h1, .job-title, [class*="job-title"]').first().text().trim() || 'Unknown';
    const company = $('[class*="company-name"], [class*="startup-name"], .employer').first().text().trim() || 'Unknown';
    const logo = $('img[class*="logo"], img[class*="avatar"]').first().attr('src') || '';
    const desc = $('.job-description, .description, [class*="description"], article, main').first().text().trim();
    const loc = $('[class*="location"]').first().text().trim() || 'Remote';
    const salaryText = $('[class*="salary"], [class*="compensation"]').first().text().trim() || '';
    const salary = this.parseSalary(salaryText);

    const tags: string[] = [];
    $('.tag, .badge, .skill, [class*="tag"]').each((_, t) => {
      const text = $(t).text().trim();
      if (text) tags.push(text);
    });

    return {
      title,
      company_name: company,
      company_logo: logo || undefined,
      location: loc,
      is_remote: true,
      salary_min: salary.min,
      salary_max: salary.max,
      salary_currency: salary.currency || 'USD',
      salary_period: 'year',
      description: desc,
      job_type: 'full-time',
      source_site: 'wellfound.com',
      source_url: url,
      source_id: url.replace(this.config.baseUrl, '').replace(/^\//, '').split('?')[0],
      tags,
      categories: this.extractCategories(`${title} ${desc}`, tags),
    };
  }
}
