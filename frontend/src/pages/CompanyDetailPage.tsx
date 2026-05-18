import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  ExternalLink,
  Users,
  Calendar,
  Briefcase,
  TrendingUp,
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

interface CompanyDetail {
  id: string | number;
  name: string;
  slug: string;
  logo?: string;
  industry: string;
  headquarters: string;
  company_size: string;
  founded_year?: number | string;
  website: string;
  job_count: number;
  description: string;
  jobs: Job[];
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

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

function CompanyHeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 bg-bg-card-hover rounded w-24" />
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-2xl bg-bg-card-hover flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-bg-card-hover rounded w-60" />
          <div className="flex gap-3">
            <div className="h-5 bg-bg-card-hover rounded w-24" />
            <div className="h-5 bg-bg-card-hover rounded w-32" />
            <div className="h-5 bg-bg-card-hover rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (company) {
      const isZh = i18n.language === 'zh';
      document.title = isZh
        ? `${company.name} - Web3 公司 | RemoteWeb3`
        : `${company.name} - Web3 Company | RemoteWeb3`;

      const description = company.description
        ? company.description.replace(/<[^>]*>/g, '').slice(0, 160)
        : `${company.name} - ${company.industry}. ${company.job_count} open positions. ${company.headquarters}.`;

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
  }, [company, i18n.language]);

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    const controller = new AbortController();
    try {
      const res = await fetch(`/api/companies/${slug}`, { signal: controller.signal });

      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return controller;
      }

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const data: CompanyDetail = await res.json();
      setCompany(data);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return controller;
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }

    return controller;
  };

  useEffect(() => {
    const controller = fetchCompany();
    return () => {
      controller.then((c) => c?.abort());
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-bg-card flex items-center justify-center">
            <Building2 className="h-12 w-12 text-text-muted/50" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-text">404</h1>
          <p className="text-text-muted text-lg">
            {t('common.noResults')}
          </p>
          <Link to="/companies" className="btn-primary inline-flex items-center gap-2">
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
          <button onClick={() => fetchCompany()} className="btn-primary text-sm">
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
          <CompanyHeaderSkeleton />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const logoFallback = company.name.charAt(0).toUpperCase();

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

        <motion.div
          className="glass-card p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="h-24 w-24 flex-shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-heading text-4xl font-bold text-primary">
                  {logoFallback}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text">
                {company.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted font-body">
                {company.industry && (
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {company.industry}
                  </span>
                )}

                {company.headquarters && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {company.headquarters}
                  </span>
                )}

                {company.company_size && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {company.company_size}
                  </span>
                )}

                {company.founded_year && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    Founded {company.founded_year}
                  </span>
                )}

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary-light hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    {company.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="mt-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-4 py-1.5 text-sm text-primary-light font-body">
                  <Briefcase className="h-4 w-4" />
                  {company.job_count.toLocaleString()} {t('home.hero.stats.jobs')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {company.description && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="font-heading text-lg font-semibold text-text mb-4">
              About {company.name}
            </h2>
            <div className="text-text-muted font-body leading-relaxed text-sm space-y-4">
              {company.description.split('\n').map((paragraph, i) =>
                paragraph.trim() ? (
                  <p key={i}>{paragraph}</p>
                ) : null
              )}
            </div>
          </motion.div>
        )}

        <motion.section
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Layers className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-xl font-bold text-text">
              Open Positions
            </h2>
          </div>

          {company.jobs && company.jobs.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {company.jobs.map((job) => (
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
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Briefcase className="h-12 w-12 mb-3 text-text-muted/40" />
              <p className="text-lg">{t('common.noResults')}</p>
            </div>
          )}

          {company.jobs && company.jobs.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                to={`/jobs?company=${company.slug}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                {t('common.viewAll')}
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
