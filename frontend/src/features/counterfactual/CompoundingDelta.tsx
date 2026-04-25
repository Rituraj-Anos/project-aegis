import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import apiClient from '../../lib/api/client';

interface DeltaPoint { week: string; actual: number; potential: number; }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(14,21,18,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600, marginBottom: '0.15rem' }}>
          {p.name}: ₹{p.value?.toLocaleString('en-IN')}
        </p>
      ))}
      {payload.length === 2 && (
        <p style={{ color: 'rgba(0,255,135,0.6)', fontSize: '0.75rem', marginTop: '0.375rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.375rem' }}>
          Delta: ₹{Math.abs((payload[1]?.value ?? 0) - (payload[0]?.value ?? 0)).toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
}

export default function CompoundingDelta() {
  const { data, isLoading } = useQuery<DeltaPoint[]>({
    queryKey: ['compounding-delta'],
    queryFn: () => apiClient.get('/analytics/compounding-delta').then(r => r.data),
  });

  const points = data ?? [];
  const maxDelta = points.reduce((acc, p) => Math.max(acc, p.potential - p.actual), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 22 }}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 20, padding: '1.75rem', height: '100%' }}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '0.25rem' }}>
          Compounding Delta
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Actual spending path vs. what could have been
        </p>
        {maxDelta > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#00FF87', fontWeight: 600 }}>
            You're leaving ₹{maxDelta.toLocaleString('en-IN')} on the table
          </motion.p>
        )}
      </div>

      {isLoading ? (
        <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
          style={{ height: 280, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
      ) : points.length === 0 ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '4rem 0' }}>
          No delta data yet. Start tracking transactions to see your compounding gap.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={points} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="potentialGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FF87" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00FF87" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.75rem' }}
              formatter={v => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
            {/* Actual path — gray */}
            <Area type="monotone" dataKey="actual" name="Actual" stroke="#9CA3AF" strokeWidth={1.5} fill="url(#actualGrad)" dot={false} />
            {/* Potential path — neon green */}
            <Area type="monotone" dataKey="potential" name="Could have been" stroke="#00FF87" strokeWidth={2.5} fill="url(#potentialGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
