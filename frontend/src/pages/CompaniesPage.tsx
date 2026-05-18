import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Search,
  Building2,
  MapPin,
  Briefcase,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface Company {
  id: string | number;
  name: string;
  slug: string;
  logo?: string;
  industry?: string;
  headquarters?: string;
  job_count?: number;
  jobCount?: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function CompanySkeleton() {
  return (
    <div className="animate-pulse glass-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-bg-card-hover" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-bg-card-hover rounded w-1/2" />
          <div className="h-3 bg-bg-card-hover rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-bg-card-hover rounded w-3/4" />
        <div className="h-3 bg-bg-card-hover rounded w-1/2" />
      </div>
      <div className="h-4 bg-bg-card-hover rounded w-28" />
    </div>
  );
}

export default function CompaniesPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const q = searchParams.get('q') || '';

  useEffect(() => {
    const isZh = i18n.language === 'zh';
    document.title = isZh
      ? 'Web3 公司 | RemoteWeb3'
      : 'Web3 Companies | RemoteWeb3';

    const description = isZh
      ? '浏览顶级Web3、区块链和加密公司。发现构建去中心化未来的团队。'
      : 'Browse top Web3, blockchain and crypto companies. Discover teams building the decentralized future.';

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

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    try {
      const params = new URLSearchParams();
      params.set('limit', '12');
      if (q) params.set('q', q);

      const res = await fetch(`/api/companies?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setCompanies(data);
        setTotal(data.length);
      } else if (data.data) {
        setCompanies(data.data);
        setTotal(data.total || data.data.length);
      } else {
        setCompanies(data);
        setTotal(typeof data === 'object' ? Object.keys(data).length : 0);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return controller;
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }

    return controller;
  };

  useEffect(() => {
    const controller = fetchCompanies();
    return () => {
      controller.then((c) => c?.abort());
    };
  }, [q]);

  const updateSearch = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('q', value);
      } else {
        next.delete('q');
      }
      return next;
    });
  };

  const getJobCount = (company: Company): number => {
    if (company.job_count != null) return company.job_count;
    if (company.jobCount != null) return company.jobCount;
    return 0;
  };

  return (
    <div className="min-h-screen">
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">
              {t('companies.title')}
            </h1>
            <p className="mt-4 text-text-muted text-base max-w-xl mx-auto">
              {total > 0
                ? `${total.toLocaleString()} ${t('home.hero.stats.companies')}`
                : t('home.hero.stats.companies')}
            </p>
          </motion.div>

          <motion.div
            className="mt-10 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="text"
                value={q}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder={t('companies.search')}
                className="w-full bg-bg-card border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm text-text placeholder:text-text-muted font-body focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 lg:pb-28">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <Zap className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-lg">{error}</p>
              <button onClick={() => fetchCompanies()} className="btn-primary text-sm">
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
                  <CompanySkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-4">
              <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center">
                <Building2 className="h-10 w-10 text-text-muted/50" />
              </div>
              <p className="text-lg">{t('common.noResults')}</p>
              {q && (
                <button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="btn-primary text-sm"
                >
                  {t('common.retry')}
                </button>
              )}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {companies.map((company) => (
                <motion.div
                  key={company.id || company.slug}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={`/companies/${company.slug}`}
                    className="glass-card block p-6 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-heading text-xl font-bold text-primary">
                            {company.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-semibold text-text truncate">
                          {company.name}
                        </h3>
                        {company.industry && (
                          <p className="text-xs text-text-muted font-body mt-0.5 truncate">
                            {company.industry}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-text-muted font-body">
                      {company.headquarters && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {company.headquarters}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        {getJobCount(company).toLocaleString()} {t('companies.jobs')}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-sm text-primary-light font-body group-hover:text-primary transition-colors">
                      {t('companies.viewProfile')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
