import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, MapPin, Briefcase, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (query: string, filters: { jobType: string; location: string }) => void;
}

const jobTypeOptions = ['', 'fullTime', 'partTime', 'contract', 'freelance', 'internship'];
const jobTypeLabels: Record<string, string> = {
  '': 'common.jobType',
  fullTime: 'common.fullTime',
  partTime: 'common.partTime',
  contract: 'common.contract',
  freelance: 'common.freelance',
  internship: 'common.internship',
};

export default function SearchBar({ onSearch }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query, { jobType, location });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`w-full max-w-3xl mx-auto rounded-2xl bg-bg-card/80 backdrop-blur-xl border transition-all duration-300 ${
        focused ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <Search className="h-5 w-5 flex-shrink-0 text-text-muted" />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t('home.hero.searchPlaceholder')}
          className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted font-body outline-none"
        />

        <div className="hidden sm:flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              <Briefcase className="h-4 w-4 text-text-muted" />
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="appearance-none bg-transparent text-text-muted font-body text-sm outline-none cursor-pointer"
              >
                <option value="">
                  {t('home.hero.search') || 'All Types'}
                </option>
                {jobTypeOptions.filter(Boolean).map((opt) => (
                  <option key={opt} value={opt}>
                    {t(jobTypeLabels[opt])}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              <MapPin className="h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Anywhere"
                className="w-24 bg-transparent text-text-muted font-body text-sm outline-none placeholder:text-text-muted"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary text-sm py-2 px-5">
            {t('home.hero.search')}
          </button>
        </div>

        <button type="submit" className="btn-primary text-sm py-2 px-5 sm:hidden">
          <Search className="h-4 w-4" />
        </button>
      </div>
    </motion.form>
  );
}
