// ============================================================
// RemoteWeb3 Spider - Web3Jobs (web3.career) Scraper
// ============================================================
import * as cheerio from 'cheerio';
import type { ScrapedJob, ScrapeResult } from '../types';
import { BaseScraper } from './base';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_JOBS = 25;

export class Web3JobsScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Web3Jobs',
      baseUrl: 'https://web3.career',
      jobListUrl: 'https://web3.career/blockchain-jobs',
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

      const rows = $('table.table tbody tr').toArray();
      console.log(`  [${this.config.name}] Found ${rows.length} job rows on page`);

      let processed = 0;
      for (const row of rows) {
        if (processed >= MAX_JOBS) break;

        try {
          const $row = $(row);
          const titleEl = $row.find('td.job-title a, td:first-child a, a[href*="/job/"]').first();
          const title = titleEl.text().trim();
          const jobPath = titleEl.attr('href') || '';
          const sourceUrl = jobPath.startsWith('http')
            ? jobPath
            : `${this.config.baseUrl}${jobPath}`;

          const companyEl = $row.find('td.company a, td:nth-child(2) a, a[href*="/company/"]').first();
          const companyName = companyEl.text().trim();
          const companyWebsite = companyEl.attr('href') || '';

          const locationEl = $row.find('td.location, td:nth-child(3)');
          const location = locationEl.text().trim() || 'Remote';

          const typeEl = $row.find('td.job-type, td:nth-child(4)');
          const typeText = typeEl.text().trim();

          const salaryEl = $row.find('td.salary, td:nth-child(5)');
          const salaryText = salaryEl.text().trim();

          const postedEl = $row.find('td.posted, td:nth-child(6), time');
          const postedDate = postedEl.attr('datetime') || postedEl.text().trim();

          const tagsText = $row.find('td.tags, .badge, .tag').map((_, el) => $(el).text().trim()).get().join(', ');

          if (!title || !companyName) continue;

          const sourceId = jobPath.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 80);

          const jobType = this.mapJobType(typeText);
          const salary = this.parseSalary(salaryText);
          const tags = this.extractTags(title, tagsText);
          const categories = this.extractCategories(tagsText, tags);

          const job: ScrapedJob = {
            title,
            company_name: companyName,
            company_website: companyWebsite || undefined,
            location,
            is_remote: location.toLowerCase().includes('remote'),
            salary_min: salary.min,
            salary_max: salary.max,
            salary_currency: salary.currency,
            description: tagsText,
            job_type: jobType,
            application_url: sourceUrl,
            source_site: 'web3.career',
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
            name: companyName,
            website: companyWebsite || undefined,
            source_site: 'web3.career',
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

          console.log(`  [${this.config.name}] [${processed + 1}/${Math.min(rows.length, MAX_JOBS)}] ${title} @ ${companyName}`);
          processed++;
          await this.sleep(100);
        } catch (err: any) {
          result.errors.push(`Row ${processed}: ${err.message}`);
          console.error(`  [WARN] Error processing row: ${err.message}`);
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
