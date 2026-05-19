// ============================================================
// RemoteWeb3 Spider - API Client
// ============================================================
import type { ScrapedJob, ApiResponse } from './types';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function post<T = ApiResponse>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

async function put<T = ApiResponse>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function upsertCompany(company: {
  name: string;
  website?: string;
  logo_url?: string;
  description?: string;
  industry?: string;
  company_size?: string;
  headquarters?: string;
  twitter_url?: string;
  linkedin_url?: string;
  github_url?: string;
  source_site: string;
}): Promise<number | null> {
  try {
    // Try to find existing company by name
    const searchRes = await fetch(
      `${API_BASE}/api/companies?q=${encodeURIComponent(company.name)}&limit=1`
    );
    const searchData: any = await searchRes.json();
    const existing = searchData.data?.[0];

    if (existing) {
      // Update existing company
      await put(`/api/admin/companies/${existing.id}`, {
        name: company.name,
        website: company.website,
        logo_url: company.logo_url,
        description: company.description,
        industry: company.industry,
        company_size: company.company_size,
        headquarters: company.headquarters,
        source_site: company.source_site,
        is_verified: 1,
      });
      return existing.id;
    }

    // Create new company
    const result = await post('/api/admin/companies', {
      name: company.name,
      website: company.website,
      logo_url: company.logo_url,
      description: company.description,
      industry: company.industry,
      company_size: company.company_size,
      headquarters: company.headquarters,
      source_site: company.source_site,
      is_verified: 0,
    });
    return result.id || null;
  } catch (err) {
    console.error(`  [WARN] Failed to upsert company "${company.name}": ${err}`);
    return null;
  }
}

export async function upsertTag(name: string, type: string = 'skill'): Promise<number | null> {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
    const res = await fetch(`${API_BASE}/api/admin/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, type }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.id;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createJob(job: ScrapedJob, companyId: number, tagIds: number[]): Promise<number | null> {
  try {
    const result = await post('/api/admin/jobs', {
      title: job.title,
      company_id: companyId,
      location: job.location,
      city: job.city || '',
      state: job.state || '',
      country: job.country || '',
      is_remote: job.is_remote ? 1 : 0,
      job_type: job.job_type,
      experience_level: job.experience_level || 'mid',
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency || 'USD',
      description: job.description,
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      source_site: job.source_site,
      source_url: job.source_url,
      source_id: job.source_id,
      application_url: job.application_url || '',
      tag_ids: tagIds,
    });
    return result.id || null;
  } catch (err) {
    console.error(`  [WARN] Failed to create job "${job.title}": ${err}`);
    return null;
  }
}

export async function checkJobExists(sourceId: string, sourceSite: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/api/jobs?source=${sourceSite}&q=${encodeURIComponent(sourceId)}&limit=1`
    );
    const data: any = await res.json();
    const jobs = data.data || [];
    return jobs.some((j: any) => j.source_id === sourceId);
  } catch {
    return false;
  }
}
