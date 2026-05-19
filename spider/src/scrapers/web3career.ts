import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedJob, ScrapeResult } from '../types';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 25;

export class Web3CareerScraper extends BaseScraper {
  constructor() {
    super({
      name: 'web3.career',
      baseUrl: 'https://web3.career',
      jobListUrl: 'https://web3.career',
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
      const rows = $('table tbody tr');

      let processed = 0;
      for (const el of rows.toArray()) {
        if (processed >= MAX_JOBS) break;
        const row = $(el);

        try {
          const titleEl = row.find('h2').first();
          const title = titleEl.text().trim();
          if (!title) continue;

          const companyEl = row.find('h3').first();
          const companyName = companyEl.text().trim();
          if (!companyName) continue;

          if (companyName.toLowerCase().includes('metana')) continue;

          const linkEl = row.find('a[href^="/"]').first();
          const relativeUrl = linkEl.attr('href') || '';
          const sourceUrl = relativeUrl.startsWith('http')
            ? relativeUrl
            : `${this.config.baseUrl}${relativeUrl}`;

          const sourceId = relativeUrl.replace(/^\//, '').split('?')[0];

          const existing = await checkJobExists(sourceId, 'web3.career');
          if (existing) {
            console.log(`  [SKIP] Already exists: ${title}`);
            processed++;
            continue;
          }

          const locationText = row.find('td').eq(2).text().trim() || 'Remote';
          const salaryText = row.find('td').eq(3).text().trim() || '';
          const postedText = row.find('td').eq(4).text().trim() || '';

          const tagEls = row.find('a[href*="-jobs"]');
          const tags: string[] = [];
          tagEls.each((_, t) => {
            const tag = $(t).text().trim();
            if (tag) tags.push(tag);
          });

          const salary = this.parseSalary(salaryText);

          const job: ScrapedJob = {
            title,
            company_name: companyName,
            location: locationText,
            is_remote: locationText.toLowerCase().includes('remote'),
            salary_min: salary.min,
            salary_max: salary.max,
            salary_currency: salary.currency || 'USD',
            salary_period: 'year',
            description: `${title} at ${companyName}. ${tags.length ? 'Tags: ' + tags.join(', ') : ''}`,
            job_type: this.mapJobType(title),
            experience_level: this.mapExperienceLevel(title),
            source_site: 'web3.career',
            source_url: sourceUrl,
            source_id: sourceId,
            posted_date: postedText,
            tags,
            categories: this.extractCategories(`${title} ${tags.join(' ')}`, tags),
          };

          const companyId = await upsertCompany({
            name: companyName,
            source_site: 'web3.career',
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

    $('table tbody tr').each((_, row) => {
      const $row = $(row);
      const title = $row.find('h2').first().text().trim();
      const company = $row.find('h3').first().text().trim();
      if (!title || !company) return;
      if (company.toLowerCase().includes('metana')) return;

      const linkEl = $row.find('a[href^="/"]').first();
      const rel = linkEl.attr('href') || '';

      const tagEls = $row.find('a[href*="-jobs"]');
      const tags: string[] = [];
      tagEls.each((_, t) => tags.push($(t).text().trim()));

      jobs.push({
        title,
        company_name: company,
        location: $row.find('td').eq(2).text().trim() || 'Remote',
        is_remote: true,
        description: '',
        job_type: 'full-time',
        source_site: 'web3.career',
        source_url: `${this.config.baseUrl}${rel}`,
        source_id: rel.replace(/^\//, '').split('?')[0],
        tags,
        categories: [],
      });
    });

    return jobs.slice(0, MAX_JOBS);
  }

  async scrapeJobDetail(url: string): Promise<ScrapedJob> {
    const html = await this.fetchHTML(url);
    const $ = this.parseHTML(html);

    const title = $('h1').first().text().trim() || 'Unknown';
    const company = $('.company-name, a[href*="company"]').first().text().trim() || 'Unknown';
    const desc = $('.job-description, .description, article').first().text().trim();
    const tags: string[] = [];
    $('.tag, .badge, a[href*="-jobs"]').each((_, t) => {
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
      source_site: 'web3.career',
      source_url: url,
      source_id: url.replace(this.config.baseUrl, '').replace(/^\//, '').split('?')[0],
      tags,
      categories: this.extractCategories(`${title} ${desc}`, tags),
    };
  }
}
