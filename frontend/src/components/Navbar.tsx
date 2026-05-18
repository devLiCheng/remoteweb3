import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';

const navLinks = [
  { key: 'home', path: '/' },
  { key: 'jobs', path: '/jobs' },
  { key: 'companies', path: '/companies' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentLang = i18n.language.startsWith('zh') ? 'zh' : 'en';

  const toggleLang = () => {
    const nextLang = currentLang === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);

    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && (pathParts[0] === 'en' || pathParts[0] === 'zh')) {
      pathParts[0] = nextLang;
      navigate(`/${pathParts.join('/')}`);
    } else {
      navigate(`/${nextLang}${location.pathname}`);
    }
    setMobileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-lg border-b border-border">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="font-heading text-xl font-bold tracking-wider text-text"
          >
            Remote<span className="text-primary-light">Web3</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.path}
                className={`font-body text-sm transition-colors hover:text-primary-light ${
                  location.pathname === link.path ||
                  location.pathname.startsWith(link.path + '/')
                    ? 'text-primary-light'
                    : 'text-text-muted'
                }`}
              >
                {t(`nav.${link.key}`)}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text hover:border-primary-light transition-colors font-body"
            >
              <Globe className="h-4 w-4" />
              {currentLang === 'en' ? 'EN' : '中文'}
            </button>
            <button className="btn-primary text-sm py-2.5 px-5">
              <Link to="/jobs/post">{t('nav.postJob')}</Link>
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-lg p-2 text-text-muted hover:text-text hover:bg-bg-card transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-t border-border bg-bg/95 backdrop-blur-lg"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 font-body text-sm transition-colors ${
                    location.pathname === link.path ||
                    location.pathname.startsWith(link.path + '/')
                      ? 'bg-primary/10 text-primary-light'
                      : 'text-text-muted hover:bg-bg-card hover:text-text'
                  }`}
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:text-text hover:border-primary-light transition-colors font-body"
                >
                  <Globe className="h-4 w-4" />
                  {currentLang === 'en' ? 'EN' : '中文'}
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/jobs/post');
                  }}
                  className="btn-primary text-sm py-2.5 px-5"
                >
                  {t('nav.postJob')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
