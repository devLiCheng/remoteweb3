import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Star,
  Globe,
  ExternalLink,
  Building2,
  Users,
  Layers,
  Zap,
} from 'lucide-react';
import JobCard from '../components/JobCard';

interface Job {
  id: string | number;
  title: string;
  company_name: string;
  company_slug?: string;
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
  description: string;
  requirements?: string;
  company_description?: string;
  company_website?: string;
  company_headquarters?: string;
  company_size?: string;
  company_job_count?: number;
  similar_jobs?: Job[];
}

function formatSalary(min?: number, max?: number, currency?: string): string | null {
  if (!min && !max) return null;
  const c = currency || 'USD';
  const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`);
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${c}`;
  if (min) return `From ${fmt(min)} ${c}`;
  if (max) return `Up to ${fmt(max!)} ${c}`;
  return null;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 bg-bg-card-hover rounded w-24" />
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-bg-card-hover" />
        <div className="space-y-2">
          <div className="h-5 bg-bg-card-hover rounded w-40" />
          <div className="h-4 bg-bg-card-hover rounded w-24" />
        </div>
      </div>
      <div className="h-10 bg-bg-card-hover rounded w-3/4" />
      <div className="flex gap-3">
        <div className="h-8 bg-bg-card-hover rounded-full w-24" />
        <div className="h-8 bg-bg-card-hover rounded-full w-28" />
        <div className="h-8 bg-bg-card-hover rounded-full w-20" />
        <div className="h-8 bg-bg-card-hover rounded-full w-32" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-bg-card-hover rounded w-full" />
        <div className="h-4 bg-bg-card-hover rounded w-full" />
        <div className="h-4 bg-bg-card-hover rounded w-3/4" />
        <div className="h-4 bg-bg-card-hover rounded w-5/6" />
        <div className="h-4 bg-bg-card-hover rounded w-2/3" />
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (job) {
      const isZh = i18n.language === 'zh';
      document.title = isZh
        ? `${job.title} - ${job.company_name} | RemoteWeb3`
        : `${job.title} at ${job.company_name} | RemoteWeb3`;

      const description = job.description
        ? job.description.replace(/<[^>]*>/g, '').slice(0, 160)
        : `${job.title} at ${job.company_name}. ${job.is_remote ? 'Remote' : ''} ${job.job_type} job in ${job.location}.`;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = 'RemoteWeb3';
    };
  }, [job, i18n.language]);

  const fetchJob = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    const controller = new AbortController();
    try {
      const res = await fetch(`/api/jobs/${id}`, { signal: controller.signal });

      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return controller;
      }

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const data: Job = await res.json();
      setJob(data);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return controller;
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }

    return controller;
  };

  useEffect(() => {
    const controller = fetchJob();
    return () => {
      controller.then((c) => c?.abort());
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-bg-card flex items-center justify-center">
            <Layers className="h-12 w-12 text-text-muted/50" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-text">404</h1>
          <p className="text-text-muted text-lg">
            {t('common.noResults')}
          </p>
          <Link to="/jobs" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.viewAll')}
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <Zap className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-text-muted text-lg">{error}</p>
          <button onClick={() => fetchJob()} className="btn-primary text-sm">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-24 max-w-5xl">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (!job) return null;

  const salaryText = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const tagList: string[] = Array.isArray(job.tags)
    ? job.tags.map((t: any) => typeof t === 'string' ? t : t.name || t.slug || String(t))
    : typeof job.tags === 'string'
      ? job.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : [];
  const logoFallback = job.company_name.charAt(0).toUpperCase();
  const requirementsList = job.requirements
    ? job.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-24 max-w-5xl">
        <motion.button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-text-muted hover:text-text transition-colors font-body text-sm mb-8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </motion.button>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
          <div className="space-y-8">
            <motion.div
              className="flex items-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to={job.company_slug ? `/companies/${job.company_slug}` : '#'}
                className="h-16 w-16 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden hover:bg-primary/20 transition-colors"
              >
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={job.company_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-heading text-2xl font-bold text-primary">
                    {logoFallback}
                  </span>
                )}
              </Link>

              <div>
                <Link
                  to={job.company_slug ? `/companies/${job.company_slug}` : '#'}
                  className="text-base font-body text-text-muted hover:text-primary-light transition-colors"
                >
                  {job.company_name}
                </Link>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-text mt-1">
                  {job.title}
                </h1>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-card border border-border px-3 py-1.5 text-xs text-text-muted font-body">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {job.location}
                {job.is_remote && (
                  <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary-light font-medium">
                    {t('common.remote')}
                  </span>
                )}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-card border border-border px-3 py-1.5 text-xs text-text-muted font-body">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                {t(`common.${job.job_type}`) || job.job_type}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-card border border-border px-3 py-1.5 text-xs text-text-muted font-body">
                <Star className="h-3.5 w-3.5 text-cta" />
                {t(`common.${job.experience_level}`) || job.experience_level}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-card border border-border px-3 py-1.5 text-xs text-text-muted font-body">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {formatDate(job.posted_date)}
              </span>

              {salaryText && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cta/10 border border-cta/30 px-3 py-1.5 text-xs text-cta font-body">
                  <DollarSign className="h-3.5 w-3.5" />
                  {salaryText}
                </span>
              )}
            </motion.div>

            {job.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="font-heading text-lg font-semibold text-text mb-4">
                  {t('jobs.viewDetails')}
                </h2>
                <div
                  className="prose prose-invert max-w-none text-text-muted font-body leading-relaxed text-sm [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:text-text [&_h3]:font-heading [&_h3]:text-text [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-2"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </motion.div>
            )}

            {requirementsList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <h2 className="font-heading text-lg font-semibold text-text mb-4">
                  Requirements
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-text-muted font-body text-sm">
                  {requirementsList.map((req, i) => (
                    <li key={i}>{req.replace(/^[-*•]\s*/, '')}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {tagList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="font-heading text-sm font-semibold text-text-muted mb-3">
                  {t('jobs.tags')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tagList.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-text-muted font-body hover:border-primary hover:text-primary-light transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <motion.aside
            className="mt-10 lg:mt-0 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  {job.company_logo ? (
                    <img
                      src={job.company_logo}
                      alt={job.company_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-heading text-lg font-bold text-primary">
                      {logoFallback}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-text">
                    {job.company_name}
                  </h3>
                  {job.company_job_count != null && (
                    <p className="text-xs text-text-muted font-body">
                      {job.company_job_count.toLocaleString()} {t('home.hero.stats.jobs')}
                    </p>
                  )}
                </div>
              </div>

              {job.company_description && (
                <p className="text-sm text-text-muted font-body leading-relaxed">
                  {job.company_description.length > 200
                    ? job.company_description.slice(0, 200) + '...'
                    : job.company_description}
                </p>
              )}

              <div className="space-y-2.5 text-sm font-body">
                {job.company_website && (
                  <a
                    href={job.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-light hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    {job.company_website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {job.company_headquarters && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Building2 className="h-4 w-4" />
                    {job.company_headquarters}
                  </div>
                )}

                {job.company_size && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Users className="h-4 w-4" />
                    {job.company_size}
                  </div>
                )}
              </div>

              <button className="btn-cta w-full flex items-center justify-center gap-2 text-base">
                {t('jobs.apply')}
              </button>

              {job.company_slug && (
                <Link
                  to={`/companies/${job.company_slug}`}
                  className="block text-center text-sm text-primary-light hover:text-primary transition-colors font-body"
                >
                  {t('companies.viewProfile')}
                  <ArrowLeft className="inline-block h-3 w-3 ml-1 rotate-180" />
                </Link>
              )}
            </div>
          </motion.aside>
        </div>

        {job.similar_jobs && job.similar_jobs.length > 0 && (
          <motion.section
            className="mt-16 border-t border-border pt-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading text-xl font-bold text-text mb-6">
              Similar Jobs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {job.similar_jobs.slice(0, 3).map((sj) => (
                <motion.div
                  key={sj.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <JobCard
                    id={sj.id}
                    title={sj.title}
                    company_name={sj.company_name}
                    company_logo={sj.company_logo}
                    location={sj.location}
                    is_remote={sj.is_remote}
                    salary_min={sj.salary_min}
                    salary_max={sj.salary_max}
                    salary_currency={sj.salary_currency}
                    job_type={sj.job_type}
                    experience_level={sj.experience_level}
                    posted_date={sj.posted_date}
                    tags={sj.tags}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
