import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { Briefcase, Building2, TrendingUp, Layers } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  target: number;
  suffix: string;
  label: string;
  isPercentage?: boolean;
}

function StatItem({ icon, target, suffix, label, isPercentage }: StatItemProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const step = 16;
    const totalSteps = duration / step;
    const increment = target / totalSteps;
    let current = 0;
    let steps = 0;

    const timer = setInterval(() => {
      steps++;
      current += increment;
      if (steps >= totalSteps) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, step);

    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 text-center"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15">
        <div className="text-primary-light">{icon}</div>
      </div>
      <div className="font-heading text-3xl font-bold text-text">
        <span
          style={{
            textShadow:
              '0 0 10px rgba(139, 92, 246, 0.3), 0 0 30px rgba(139, 92, 246, 0.15)',
          }}
        >
          {count.toLocaleString()}
          {isPercentage && '%'}
        </span>
        <span className="text-text-muted ml-1 text-lg font-body font-normal">
          {suffix}
        </span>
      </div>
      <p className="mt-2 text-sm text-text-muted font-body">{label}</p>
    </motion.div>
  );
}

const statsConfig = [
  {
    key: 'jobs',
    target: 70342,
    icon: <Briefcase className="h-6 w-6" />,
  },
  {
    key: 'companies',
    target: 7310,
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    key: 'remote',
    target: 82,
    isPercentage: true,
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    key: 'updated',
    target: 0,
    suffix: 'Daily',
    icon: <Layers className="h-6 w-6" />,
  },
];

export default function StatsCounter() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat) => (
        <StatItem
          key={stat.key}
          icon={stat.icon}
          target={stat.target}
          suffix={stat.suffix || '+'}
          label={t(`home.hero.stats.${stat.key}`)}
          isPercentage={stat.isPercentage}
        />
      ))}
    </div>
  );
}
