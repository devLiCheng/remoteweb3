import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedJob, ScrapeResult } from '../types';
import { upsertCompany, createJob, upsertTag, checkJobExists } from '../api';

const MAX_PAGES = 150;
const MAX_JOBS_PER_RUN = 2000;

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
      let totalProcessed = 0;
      
      for (let page = 1; page <= MAX_PAGES; page++) {
        if (totalProcessed >= MAX_JOBS_PER_RUN) break;
        
        const url = page === 1 ? this.config.jobListUrl : `${this.config.jobListUrl}?page=${page}`;
        console.log(`  Page ${page}: ${url}`);
        
        let html: string;
        try {
          html = await this.fetchHTML(url);
        } catch {
          console.log(`  [DONE] No more pages (stopped at page ${page})`);
          break;
        }

        const $ = this.parseHTML(html);
        const rows = $('table tbody tr');
        
        if (rows.length === 0) {
          console.log(`  [DONE] No more rows on page ${page}`);
          break;
        }

        let pageProcessed = 0;
        for (const el of rows.toArray()) {
          if (totalProcessed >= MAX_JOBS_PER_RUN) break;
          
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
            if (!relativeUrl || relativeUrl === '/post-web3-job') continue;
            
            const sourceUrl = relativeUrl.startsWith('http') ? relativeUrl : `${this.config.baseUrl}${relativeUrl}`;
            const sourceId = relativeUrl.replace(/^\//, '').split('?')[0];
            if (!sourceId || sourceId.length < 3) continue;

            const existing = await checkJobExists(sourceId, 'web3.career');
            if (existing) {
              pageProcessed++;
              totalProcessed++;
              continue;
            }

            const locationText = row.find('td').eq(2).text().trim() || 'Remote';
            const salaryText = row.find('td').eq(3).text().trim() || '';
            const postedDate = row.find('td').eq(4).text().trim() || '';

            const tagEls = row.find('a[href*="-jobs"]');
            const tags: string[] = [];
            tagEls.each((_, t) => {
              const tag = $(t).text().trim();
              if (tag && tag.length < 50 && !tag.includes(',') && !tag.includes('United States')) tags.push(tag);
            });

            const salary = this.parseSalary(salaryText);
            const description = `Position: ${title} at ${companyName}. Location: ${locationText}. Source: web3.career`;
            const jobType = this.mapJobType(title);
            const expLevel = this.mapExperienceLevel(title);

            const allTags = [...new Set([...tags, ...this.extractTags(title, description)])];

            const job: ScrapedJob = {
              title,
              company_name: companyName,
              company_website: '',
              location: locationText,
              is_remote: locationText.toLowerCase().includes('remote'),
              salary_min: salary.min,
              salary_max: salary.max,
              salary_currency: salary.currency,
              salary_period: 'year',
              description,
              requirements: '',
              benefits: '',
              job_type: jobType,
              experience_level: expLevel,
              application_url: sourceUrl,
              source_site: 'web3.career',
              source_url: sourceUrl,
              source_id: sourceId,
              posted_date: postedDate,
              tags: allTags,
              categories: this.extractCategories(description, allTags),
            };

            const companyId = await upsertCompany({
              name: companyName,
              website: job.company_website,
              source_site: 'web3.career',
            });

            if (companyId) {
              result.companiesInserted++;
              const tagIds: number[] = [];
              for (const tagName of allTags.slice(0, 10)) {
                const tid = await upsertTag(tagName);
                if (tid) tagIds.push(tid);
              }
              const jid = await createJob(job, companyId, tagIds);
              if (jid) {
                result.jobsInserted++;
                console.log(`  [OK] ${title} @ ${companyName}`);
              }
            }

            result.jobsScraped++;
            pageProcessed++;
            totalProcessed++;
            await this.sleep(50);
          } catch (err: any) {
            result.errors.push(`${titleEl?.text()?.trim() || '?'}: ${err.message}`);
          }
        }

        console.log(`  Page ${page}: ${pageProcessed} processed, total ${totalProcessed}`);
        
        if (totalProcessed >= MAX_JOBS_PER_RUN) break;
        await this.sleep(1000);
      }
    } catch (err: any) {
      result.errors.push(`Fatal: ${err.message}`);
    }

    result.duration = Date.now() - start;
    return result;
  }
}
