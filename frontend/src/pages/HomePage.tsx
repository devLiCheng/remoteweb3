import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Code,
  Palette,
  Megaphone,
  Box,
  Coins,
  Image,
  Gamepad2,
  Users,
  Shield,
  Brain,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import StatsCounter from '../components/StatsCounter';
import JobCard from '../components/JobCard';
import ThreeBackground from '../components/ThreeBackground';

interface Job {
  id: number;
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
  tag_names?: string;
}

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  job_count: number;
  slug: string;
}

interface Category {
  icon: React.ComponentType<{ className?: string }>;
  nameKey: string;
  defaultName: string;
  count: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const categories: Category[] = [
  { icon: Code, nameKey: 'home.categories.engineering', defaultName: 'Engineering', count: 12400 },
  { icon: Palette, nameKey: 'home.categories.design', defaultName: 'Design', count: 3200 },
  { icon: Megaphone, nameKey: 'home.categories.marketing', defaultName: 'Marketing', count: 2800 },
  { icon: Box, nameKey: 'home.categories.product', defaultName: 'Product', count: 5100 },
  { icon: Coins, nameKey: 'home.categories.defi', defaultName: 'DeFi', count: 8900 },
  { icon: Image, nameKey: 'home.categories.nft', defaultName: 'NFT', count: 4200 },
  { icon: Gamepad2, nameKey: 'home.categories.gaming', defaultName: 'Gaming', count: 3700 },
  { icon: Users, nameKey: 'home.categories.dao', defaultName: 'DAO', count: 1500 },
  { icon: Shield, nameKey: 'home.categories.security', defaultName: 'Security', count: 4600 },
  { icon: Brain, nameKey: 'home.categories.aiml', defaultName: 'AI/ML', count: 6300 },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse glass-card min-w-[300px] flex-shrink-0 p-6 space-y-4">
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

function CompanySkeleton() {
  return (
    <div className="animate-pulse glass-card min-w-[180px] flex-shrink-0 p-6 flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-bg-card-hover" />
      <div className="h-4 bg-bg-card-hover rounded w-20" />
      <div className="h-3 bg-bg-card-hover rounded w-14" />
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="animate-pulse glass-card p-6 flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-bg-card-hover" />
      <div className="h-4 bg-bg-card-hover rounded w-24" />
      <div className="h-3 bg-bg-card-hover rounded w-16" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <p className="text-lg">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-4">
      <p className="text-lg">{message}</p>
      <button onClick={onRetry} className="btn-primary text-sm">
        Retry
      </button>
    </div>
  );
}

export default function HomePage() {
  const { t, i18n } = useTranslation();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  useEffect(() => {
    const isZh = i18n.language === 'zh';
    document.title = isZh
      ? 'RemoteWeb3 - Web3 远程工作与加密职业'
      : 'RemoteWeb3 - Web3 Remote Jobs & Crypto Careers';

    const metaTags = [
      { name: 'description', content: isZh
        ? '浏览全球7,000多家Web3公司的70,000+区块链和加密远程工作。找到你的下一份远程Web3工作。'
        : 'Browse 70,000+ blockchain and crypto remote jobs from over 7,000 Web3 companies worldwide. Find your next remote Web3 job.'
      },
      { name: 'keywords', content: 'web3 jobs, crypto jobs, blockchain jobs, remote jobs, defi jobs, nft jobs, solidity jobs, ethereum jobs, smart contract developer' },
      { property: 'og:title', content: isZh
        ? 'RemoteWeb3 - Web3 远程工作与加密职业'
        : 'RemoteWeb3 - Web3 Remote Jobs & Crypto Careers'
      },
      { property: 'og:description', content: isZh
        ? '领先的Web3、区块链和加密远程工作平台。浏览70,000+远程Web3职位。'
        : 'The leading Web3, blockchain, and crypto remote job platform. Browse 70,000+ remote Web3 jobs.'
      },
      { property: 'og:type', content: 'website' },
    ];

    metaTags.forEach(({ name, content, property }) => {
      if (property) {
        let el = document.querySelector(`meta[property="${property}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('property', property);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      } else if (name) {
        let el = document.querySelector(`meta[name="${name}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('name', name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      }
    });

    return () => {
      document.title = 'RemoteWeb3';
    };
  }, [i18n.language]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const res = await fetch('/api/jobs?limit=6&sort=posted_date');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data: Job[] = await res.json();
      setJobs(data);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    setCompaniesError(null);
    try {
      const res = await fetch('/api/companies?limit=12');
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data: Company[] = await res.json();
      setCompanies(data);
    } catch (err) {
      setCompaniesError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCompanies();
  }, []);

  return (
    <div className="relative">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ThreeBackground />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/20 to-bg z-[1]" />

        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center max-w-5xl">
          <motion.h1
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {t('home.hero.title')}{' '}
            <span className="text-primary glow-text block sm:inline">
              {t('home.hero.titleHighlight')}
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-text-muted text-base sm:text-lg max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            {t('home.hero.subtitle')}
          </motion.p>

          <motion.div
            className="mt-10 w-full max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            <SearchBar />
          </motion.div>

          <motion.div
            className="mt-12 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          >
            <StatsCounter />
          </motion.div>
        </div>
      </section>

      {/* ==================== CATEGORIES SECTION ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.h2
            className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-center"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            {t('home.categories')}
          </motion.h2>

          <motion.div
            className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-30px' }}
          >
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.nameKey}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                >
                  <Link
                    to={`/jobs?category=${encodeURIComponent(category.defaultName.toLowerCase())}`}
                    className="glass-card p-5 flex flex-col items-center gap-3 text-center cursor-pointer group transition-all duration-300 hover:-translate-y-1 block"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-heading text-sm font-semibold text-text">
                      {t(category.nameKey, category.defaultName)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {category.count.toLocaleString()} {t('home.hero.stats.jobs')}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ==================== FEATURED JOBS SECTION ==================== */}
      <section className="py-20 lg:py-28 bg-bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="flex items-center justify-between mb-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-cta" />
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
                {t('home.featured')}
              </h2>
            </div>
            <Link
              to="/jobs"
              className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors duration-300 font-semibold text-sm sm:text-base"
            >
              {t('common.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {jobsError && (
            <ErrorState message={t('common.error')} onRetry={fetchJobs} />
          )}

          {!jobsError && (
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/30 [&::-webkit-scrollbar-track]:bg-transparent">
              {jobsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="snap-start">
                      <SkeletonCard />
                    </div>
                  ))
                : jobs.length > 0
                  ? jobs.map((job) => (
                      <motion.div
                        key={job.id}
                        className="snap-start"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        <JobCard {...job} />
                      </motion.div>
                    ))
                  : <EmptyState message={t('common.noResults')} />}
            </div>
          )}
        </div>
      </section>

      {/* ==================== LATEST JOBS SECTION ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="flex items-center gap-3 mb-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
              {t('home.latest')}
            </h2>
          </motion.div>

          {jobsError && (
            <ErrorState message={t('common.error')} onRetry={fetchJobs} />
          )}

          {!jobsError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobsLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : jobs.length > 0
                  ? jobs.map((job) => (
                      <motion.div
                        key={job.id}
                        variants={fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        <JobCard {...job} />
                      </motion.div>
                    ))
                  : <div className="col-span-full"><EmptyState message={t('common.noResults')} /></div>}
            </div>
          )}

          <motion.div
            className="mt-10 text-center"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/jobs"
              className="btn-primary inline-flex items-center gap-2"
            >
              {t('common.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ==================== TOP COMPANIES SECTION ==================== */}
      <section className="py-20 lg:py-28 bg-bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="flex items-center justify-between mb-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
                {t('home.companies')}
              </h2>
            </div>
            <Link
              to="/companies"
              className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors duration-300 font-semibold text-sm sm:text-base"
            >
              {t('common.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {companiesError && (
            <ErrorState message={t('common.error')} onRetry={fetchCompanies} />
          )}

          {!companiesError && (
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/30 [&::-webkit-scrollbar-track]:bg-transparent">
              {companiesLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="snap-start">
                      <CompanySkeleton />
                    </div>
                  ))
                : companies.length > 0
                  ? companies.map((company) => (
                      <motion.div
                        key={company.id}
                        className="snap-start"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        <Link
                          to={`/companies/${company.slug}`}
                          className="glass-card min-w-[180px] flex-shrink-0 p-6 flex flex-col items-center gap-3 cursor-pointer group transition-all duration-300 hover:-translate-y-1 block"
                        >
                          {company.logo_url ? (
                              <img
                                src={company.logo_url}
                              alt={company.name}
                              className="w-16 h-16 rounded-2xl object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                              <span className="font-heading text-xl font-bold text-primary">
                                {company.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-heading text-sm font-semibold text-text text-center line-clamp-1">
                            {company.name}
                          </span>
                          <span className="text-xs text-text-muted">
                            {company.job_count.toLocaleString()} {t('home.hero.stats.jobs')}
                          </span>
                        </Link>
                      </motion.div>
                    ))
                  : <EmptyState message={t('common.noResults')} />}
            </div>
          )}
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-bg opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)_0%,transparent_50%)] opacity-30" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h2
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            {t('home.cta.title')}
          </motion.h2>

          <motion.p
            className="mt-6 text-white/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {t('home.cta.subtitle')}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              to="/jobs"
              className="mt-10 inline-flex items-center gap-3 btn-cta text-lg px-10 py-4"
            >
              {t('home.cta.button')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
