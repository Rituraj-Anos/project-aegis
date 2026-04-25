import { motion } from 'framer-motion';
import { X, ArrowRight, Sprout, TrendingUp } from 'lucide-react';
import type { CoachAlert } from '../App';
import { COACH_CONFIG, inr } from '../mock/data';
import { apiAcknowledgeAlert } from '../features/alerts/api';

interface Props {
  alert: CoachAlert;
  coachState: 0 | 1 | 2;
  onClose: () => void;
}

export default function CoachOverlay({ alert, coachState, onClose }: Props) {
  const cfg = COACH_CONFIG[coachState];
  const isPulsing = coachState === 1;

  const handleClose = async () => {
    if (alert._id !== 'dev-test') {
      try {
        await apiAcknowledgeAlert(alert._id);
      } catch (err) {
        console.error('Failed to acknowledge alert', err);
      }
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: coachState === 2 ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,0,0.65)' }}
      />

      {/* Card — slides up */}
      <motion.div key="card"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 540, zIndex: 401, background: '#0F1512', border: `1px solid ${cfg.border}`, borderBottom: 'none', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '2rem', boxShadow: `0 -16px 64px rgba(0,0,0,0.7), 0 0 40px ${cfg.color}12` }}>

        {/* Pulsing border for Firm */}
        {isPulsing && (
          <motion.div animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
            style={{ position: 'absolute', inset: -1, borderRadius: 24, border: `2px solid ${cfg.color}`, borderBottom: 'none', pointerEvents: 'none' }} />
        )}

        {/* Close */}
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleClose}
          style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', display: 'flex', padding: 4, borderRadius: 6 }}>
          <X size={18} />
        </motion.button>

        {/* Coach badge */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--r-pill)', background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: '0.75rem', fontWeight: 700, color: cfg.color }}>
          <motion.span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          {cfg.label} Mode
        </motion.div>

        {/* Transaction amount */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--tx-3)', marginBottom: '0.25rem' }}>
            {alert.tone} · transaction intercepted
          </p>
          <p style={{ fontFamily: 'var(--font-head)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: coachState === 2 ? 'var(--danger)' : 'var(--tx-1)' }}>
            {inr(alert.amount)}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--tx-3)', marginTop: '0.25rem' }}>{alert.description}</p>
        </motion.div>

        {/* Projections row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'SIP 10yr', val: alert.projectedSIP, color: 'var(--green)' },
            { label: 'FD 10yr', val: alert.projectedFD, color: 'var(--amber)' },
            { label: 'Inflation adj', val: alert.projectedInflationAdj, color: 'var(--tx-2)' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: 'var(--s-high)', borderRadius: 12, padding: '0.875rem', textAlign: 'center' }}>
              <TrendingUp size={14} color={color} style={{ marginBottom: '0.375rem' }} />
              <p style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', fontWeight: 700, color }}>{inr(val)}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--tx-3)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Message */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--tx-1)', lineHeight: 1.6 }}>{alert.message}</p>
          <p style={{ fontSize: '0.8125rem', color: cfg.color, fontWeight: 600, marginTop: '0.5rem' }}>💡 {alert.shadowInsight}</p>
        </motion.div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleClose}
            className="btn-ghost" style={{ flex: 1 }}>
            <ArrowRight size={15} /> Proceed anyway
          </motion.button>
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(0,255,135,0.4)' }} whileTap={{ scale: 0.97 }} onClick={handleClose}
            className="btn-primary" style={{ flex: 1 }}>
            <Sprout size={15} /> Reconsider 🌱
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
