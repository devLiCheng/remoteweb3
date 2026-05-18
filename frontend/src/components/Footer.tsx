import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ExternalLink } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <Link
              to="/"
              className="font-heading text-lg font-bold tracking-wider text-text"
            >
              Remote<span className="text-primary-light">Web3</span>
            </Link>
            <p className="mt-4 text-sm text-text-muted leading-relaxed font-body">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-text uppercase tracking-wider">
              {t('footer.jobs')}
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/jobs"
                  className="text-sm text-text-muted hover:text-primary-light transition-colors font-body"
                >
                  {t('footer.jobs')}
                </Link>
              </li>
              <li>
                <Link
                  to="/companies"
                  className="text-sm text-text-muted hover:text-primary-light transition-colors font-body"
                >
                  {t('footer.companies')}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm text-text-muted hover:text-primary-light transition-colors font-body"
                >
                  {t('footer.about')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-text uppercase tracking-wider">
              {t('footer.resources')}
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="/blog"
                  className="text-sm text-text-muted hover:text-primary-light transition-colors font-body inline-flex items-center gap-1"
                >
                  {t('footer.blog')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-sm text-text-muted hover:text-primary-light transition-colors font-body"
                >
                  {t('footer.contact')}
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-sm text-text-muted hover:text-primary-light transition-colors font-body"
                >
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-sm text-text-muted hover:text-primary-light transition-colors font-body"
                >
                  {t('footer.terms')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-text uppercase tracking-wider">
              Newsletter
            </h3>
            <p className="mt-4 text-sm text-text-muted font-body">
              Get the latest Web3 jobs delivered to your inbox.
            </p>
            {subscribed ? (
              <p className="mt-4 text-sm text-primary-light font-body">
                Thanks for subscribing!
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-4 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted font-body focus:border-primary-light focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="btn-primary p-2 flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-xs text-text-muted font-body">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
