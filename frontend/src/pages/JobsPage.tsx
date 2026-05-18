import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Layers,
  Zap,
} from 'lucide-react';
import JobCard from '../components/JobCard';

interface Job {
  id: string | number;
  title: string;
  company_name: string;
  company_logo?: string;
  location: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  job_type: string;
  experience_level: string;
  posted_date: string;
  tags?: string;
}

interface PaginatedResponse {
  data: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const JOB_TYPES = ['', 'full-time', 'part-time', 'contract', 'internship', 'freelance'] as const;
const EXPERIENCE_LEVELS = ['', 'entry', 'mid', 'senior', 'lead', 'executive'] as const;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'salary_desc', label: 'Highest Salary' },
] as const;

function SkeletonCard() {
  return (
    <div className="animate-pulse glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-bg-card-hover" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-bg-card-hover rounded w-3/4" />
          <div className="h-3 bg-bg-card-hover rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-bg-card-hover rounded w-full" />
        <div className="h-3 bg-bg-card-hover rounded w-2/3" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-bg-card-hover rounded-full w-16" />
        <div className="h-6 bg-bg-card-hover rounded-full w-16" />
        <div className="h-6 bg-bg-card-hover rounded-full w-20" />
      </div>
    </div>
  );
}

export default function JobsPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const q = searchParams.get('q') || '';
  const remote = searchParams.get('remote') === 'true';
  const jobType = searchParams.get('type') || '';
  const level = searchParams.get('level') || '';
  const salaryMin = searchParams.get('salary_min') || '';
  const sort = searchParams.get('sort') || 'newest';

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  };

  useEffect(() => {
    const isZh = i18n.language === 'zh';
    document.title = isZh
      ? '全部Web3职位 | RemoteWeb3'
      : 'All Web3 Jobs | RemoteWeb3';

    const description = isZh
      ? '浏览全球Web3、区块链和加密远程工作。按类型、经验水平和薪资筛选。'
      : 'Browse global Web3, blockchain and crypto remote jobs. Filter by type, experience level and salary.';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    return () => {
      document.title = 'RemoteWeb3';
    };
  }, [i18n.language]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (q) params.set('q', q);
      if (remote) params.set('remote', 'true');
      if (jobType) params.set('type', jobType);
      if (level) params.set('level', level);
      if (salaryMin) params.set('salary_min', salaryMin);
      params.set('sort', sort);

      const res = await fetch(`/api/jobs?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const data: PaginatedResponse = await res.json();
      setJobs(data.data);
      setTotalPages(data.totalPages);
      setTotalJobs(data.total);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return controller;
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }

    return controller;
  };

  useEffect(() => {
    const controller = fetchJobs();
    return () => {
      controller.then((c) => c?.abort());
    };
  }, [page, q, remote, jobType, level, salaryMin, sort]);

  const clearFilter = (key: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(key);
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  };

  const activeFilters: { key: string; label: string }[] = [];
  if (q) activeFilters.push({ key: 'q', label: `"${q}"` });
  if (remote) activeFilters.push({ key: 'remote', label: t('jobs.filters.remote') });
  if (jobType) activeFilters.push({ key: 'type', label: t(`common.${jobType.replace('-', '')}`) || jobType });
  if (level) activeFilters.push({ key: 'level', label: t(`common.${level}`) || level });
  if (salaryMin) activeFilters.push({ key: 'salary_min', label: `$${parseInt(salaryMin).toLocaleString()}+` });

  return (
    <div className="min-h-screen">
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">
              {t('jobs.title')}
            </h1>
            <p className="mt-4 text-text-muted text-base max-w-xl mx-auto">
              {totalJobs > 0
                ? `${totalJobs.toLocaleString()} ${t('home.hero.stats.jobs')}`
                : t('home.hero.stats.jobs')}
            </p>
          </motion.div>

          <motion.div
            className="mt-10 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="glass-card p-4 sm:p-5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateParam('q', e.target.value)}
                    placeholder={t('jobs.filters.search')}
                    className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted font-body focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-sm text-text-muted hover:text-text hover:border-primary transition-colors font-body"
                >
                  <Filter className="h-4 w-4" />
                  {t('jobs.filters.sort')}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2 text-sm text-text-muted font-body cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remote}
                      onChange={(e) => updateParam('remote', e.target.checked ? 'true' : '')}
                      className="rounded border-border bg-bg text-primary focus:ring-primary"
                    />
                    {t('jobs.filters.remote')}
                  </label>

                  <div>
                    <select
                      value={jobType}
                      onChange={(e) => updateParam('type', e.target.value)}
                      className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text font-body focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">{t('jobs.filters.type')}</option>
                      {JOB_TYPES.filter(Boolean).map((opt) => (
                        <option key={opt} value={opt}>
                          {t(`common.${opt.replace('-', '')}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={level}
                      onChange={(e) => updateParam('level', e.target.value)}
                      className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text font-body focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">{t('jobs.filters.level')}</option>
                      {EXPERIENCE_LEVELS.filter(Boolean).map((opt) => (
                        <option key={opt} value={opt}>
                          {t(`common.${opt}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={salaryMin}
                      onChange={(e) => updateParam('salary_min', e.target.value)}
                      placeholder={`$ ${t('jobs.filters.salary')}`}
                      min="0"
                      className="flex-1 bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted font-body focus:border-primary focus:outline-none transition-colors"
                    />
                    <select
                      value={sort}
                      onChange={(e) => updateParam('sort', e.target.value)}
                      className="bg-bg border border-border rounded-lg px-2 py-2.5 text-sm text-text font-body focus:border-primary focus:outline-none transition-colors"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value === 'newest' ? t('jobs.filters.newest') : t('jobs.filters.salary')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={filter.key}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs text-primary-light font-body"
                  >
                    {filter.label}
                    <button
                      onClick={() => clearFilter(filter.key)}
                      className="hover:text-text transition-colors"
                      aria-label={`Remove ${filter.key} filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {activeFilters.length > 1 && (
                  <button
                    onClick={() =>
                      setSearchParams((prev) => {
                        const next = new URLSearchParams();
                        const sortVal = prev.get('sort');
                        if (sortVal) next.set('sort', sortVal);
                        next.set('page', '1');
                        return next;
                      })
                    }
                    className="text-xs text-text-muted hover:text-text transition-colors font-body underline"
                  >
                    {t('common.retry')}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="pb-20 lg:pb-28">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <Zap className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-lg">{error}</p>
              <button
                onClick={() => fetchJobs()}
                className="btn-primary text-sm"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : loading ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div key={i} variants={fadeInUp}>
                  <SkeletonCard />
                </motion.div>
              ))}
            </motion.div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-4">
              <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center">
                <Layers className="h-10 w-10 text-text-muted/50" />
              </div>
              <p className="text-lg">{t('jobs.noResults')}</p>
              {activeFilters.length > 0 && (
                <button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="btn-primary text-sm"
                >
                  {t('common.retry')}
                </button>
              )}
            </div>
          ) : (
            <>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {jobs.map((job) => (
                  <motion.div key={job.id} variants={fadeInUp}>
                    <JobCard
                      id={job.id}
                      title={job.title}
                      company_name={job.company_name}
                      company_logo={job.company_logo}
                      location={job.location}
                      is_remote={job.is_remote}
                      salary_min={job.salary_min}
                      salary_max={job.salary_max}
                      salary_currency={job.salary_currency}
                      job_type={job.job_type}
                      experience_level={job.experience_level}
                      posted_date={job.posted_date}
                      tags={job.tags}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2 font-body">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true;
                      if (p === 1 || p === totalPages) return true;
                      if (Math.abs(p - page) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push('ellipsis');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-text-muted text-sm">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => updateParam('page', String(item))}
                          className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors ${
                            item === page
                              ? 'bg-primary text-white'
                              : 'border border-border text-text-muted hover:text-text hover:border-primary'
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}

                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', String(page + 1))}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
