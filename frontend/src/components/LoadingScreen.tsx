import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg">
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-3xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <h1
          className="font-heading text-4xl md:text-5xl font-bold tracking-wider text-text relative"
          style={{
            textShadow:
              '0 0 10px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2), 0 0 80px rgba(139, 92, 246, 0.1)',
          }}
        >
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            Remote
          </motion.span>
          <motion.span
            className="text-primary-light"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          >
            Web3
          </motion.span>
        </h1>
      </div>

      <motion.p
        className="mt-6 text-text-muted font-body text-sm"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {t('common.loading')}
      </motion.p>

      <div className="mt-8 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-primary"
            animate={{
              y: [0, -12, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
