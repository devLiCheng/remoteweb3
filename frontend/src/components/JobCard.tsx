import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Briefcase } from 'lucide-react';

interface JobCardProps {
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

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatSalary(
  min?: number,
  max?: number,
  currency?: string
): string | null {
  if (!min && !max) return null;
  const c = currency || 'USD';
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${c}`;
  if (min) return `From ${fmt(min)} ${c}`;
  if (max) return `Up to ${fmt(max!)} ${c}`;
  return null;
}

export default function JobCard({
  id,
  title,
  company_name,
  company_logo,
  location,
  is_remote,
  salary_min,
  salary_max,
  salary_currency,
  job_type,
  experience_level,
  posted_date,
  tags,
}: JobCardProps) {
  const { t } = useTranslation();
  const logoFallback = company_name.charAt(0).toUpperCase();
  const salaryText = formatSalary(salary_min, salary_max, salary_currency);
  const tagList = tags
    ? tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];
  const relativeTime = getRelativeTime(posted_date);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={`/jobs/${id}`}
        className="glass-card block p-5 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
            {company_logo ? (
              <img
                src={company_logo}
                alt={company_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-heading text-lg font-bold text-primary-light">
                {logoFallback}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-semibold text-text truncate">
              {title}
            </h3>
            <p className="mt-0.5 text-sm text-text-muted font-body">
              {company_name}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted font-body">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
                {is_remote && (
                  <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary-light font-medium">
                    {t('common.remote')}
                  </span>
                )}
              </span>
              {salaryText && (
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {salaryText}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {t(`common.${job_type}`) || job_type}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {relativeTime}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-cta/20 px-2 py-0.5 text-[11px] font-medium text-cta font-body">
                {t(`common.${experience_level}`) || experience_level}
              </span>
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-muted font-body"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
