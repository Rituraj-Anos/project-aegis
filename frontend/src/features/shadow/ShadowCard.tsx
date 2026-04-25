import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';
import apiClient from '../../lib/api/client';

interface ShadowData {
  amount: number;
  sipValue: number;
  fdValue: number;
  timeHorizonYears: number;
  sipRate: number;
}

interface ShadowCardProps {
  amount: number;
  compact?: boolean;
}

export default function ShadowCard({ amount, compact = false }: ShadowCardProps) {
  const { data, isLoading } = useQuery<ShadowData>({
    queryKey: ['shadow-card', amount],
    queryFn: () => apiClient.get(`/shadow/calculate?amount=${amount}`).then(r => r.data),
    enabled: amount > 0,
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
        style={{ height: compact ? 28 : 52, borderRadius: 8, background: 'rgba(0,255,135,0.06)' }} />
    );
  }

  if (!data?.sipValue) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.2rem 0.625rem', borderRadius: 6,
          background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.15)',
          fontSize: '0.7rem', color: '#00FF87', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        <Sprout size={11} />
        ₹{data.sipValue.toLocaleString('en-IN')} in {data.timeHorizonYears}y
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(0,255,135,0.06)',
        border: '1px solid rgba(0,255,135,0.15)',
        borderRadius: 12,
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginTop: 2 }}
      >
        <Sprout size={18} color="#00FF87" />
      </motion.div>
      <div>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#00FF87', marginBottom: '0.2rem' }}>
          Shadow SIP Value
        </p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: '0.875rem', color: '#EAEAEA', lineHeight: 1.5 }}
        >
          ₹{amount.toLocaleString('en-IN')} spent ={' '}
          <strong style={{ color: '#00FF87' }}>
            ₹{data.sipValue.toLocaleString('en-IN')}
          </strong>{' '}
          in {data.timeHorizonYears} years{' '}
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            (SIP @ {data.sipRate}%)
          </span>
        </motion.p>
        {data.fdValue > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            FD alternative: ₹{data.fdValue.toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </motion.div>
  );
}
