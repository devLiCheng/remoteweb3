// ============================================================
// RemoteWeb3 Spider - Unified Data Types
// ============================================================

export interface ScrapedJob {
  title: string;
  company_name: string;
  company_website?: string;
  company_logo?: string;
  company_description?: string;
  company_industry?: string;
  company_size?: string;
  company_headquarters?: string;
  company_twitter?: string;
  company_linkedin?: string;
  company_github?: string;

  location: string;
  city?: string;
  state?: string;
  country?: string;
  is_remote: boolean;

  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;

  description: string;
  requirements?: string;
  benefits?: string;

  job_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  experience_level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  department?: string;

  application_url?: string;
  source_site: string;
  source_url: string;
  source_id: string;
  posted_date?: string;

  tags: string[];
  categories: string[];
}

export interface ScrapeResult {
  site: string;
  jobsScraped: number;
  jobsInserted: number;
  companiesInserted: number;
  errors: string[];
  duration: number;
}

export interface ApiResponse {
  id?: number;
  success?: boolean;
  error?: string;
}

export interface ApiPagination {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
