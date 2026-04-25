import { motion } from 'framer-motion';

interface FullPageSpinnerProps {
  message?: string;
}

export default function FullPageSpinner({ message }: FullPageSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        gap: '1.5rem',
        zIndex: 9999,
      }}
    >
      {/* Outer ring */}
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <motion.span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid var(--surface-border)',
          }}
        />
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--accent-green)',
            borderRightColor: 'var(--accent-green)',
            boxShadow: '0 0 16px var(--accent-green-glow)',
            display: 'block',
          }}
        />
        {/* Inner dot */}
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'var(--accent-green)',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 8px var(--accent-green)',
          }}
        />
      </div>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            letterSpacing: '0.04em',
          }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
}
