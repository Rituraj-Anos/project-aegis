import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import apiClient from '../../lib/api/client';

interface ProjectionPoint {
  year: number;
  sip: number;
  fd: number;
  inflationAdj: number;
}

interface ProjectionData {
  amount: number;
  timeHorizonYears: number;
  sipRate: number;
  fdRate: number;
  inflationRate: number;
  points: ProjectionPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(14,21,18,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.375rem', fontWeight: 500 }}>Year {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600, marginBottom: '0.15rem' }}>
          {p.name}: ₹{p.value?.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
}

interface ProjectionChartProps {
  amount?: number;
}

export default function ProjectionChart({ amount = 10000 }: ProjectionChartProps) {
  const { data, isLoading } = useQuery<ProjectionData>({
    queryKey: ['shadow-projection', amount],
    queryFn: () => apiClient.get(`/shadow/calculate?amount=${amount}`).then(r => r.data),
  });

  const points = data?.points ?? [];
  const lastPoint = points[points.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: '1.5rem' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '0.25rem' }}>
          Compounding Projection
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          What ₹{amount.toLocaleString('en-IN')} could become if invested
        </p>
      </div>

      {/* Headline numbers */}
      {!isLoading && lastPoint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}
        >
          {[
            { label: `SIP @ ${data?.sipRate ?? 12}%`, value: lastPoint.sip, color: '#00FF87' },
            { label: `FD @ ${data?.fdRate ?? 7}%`, value: lastPoint.fd, color: '#FFB347' },
            { label: 'Inflation-adj', value: lastPoint.inflationAdj, color: '#9CA3AF' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', fontWeight: 700, color: s.color }}>
                ₹{s.value?.toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                in {data?.timeHorizonYears ?? 10} yrs
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Chart */}
      {isLoading ? (
        <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
          style={{ height: 200, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
      ) : points.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={points} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <XAxis dataKey="year" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Year', position: 'insideBottomRight', offset: 0, fill: 'var(--text-tertiary)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }}
              formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
            <ReferenceLine y={amount} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="sip" name="SIP" stroke="#00FF87" strokeWidth={2.5} dot={false} filter="url(#glow)" />
            <Line type="monotone" dataKey="fd" name="FD" stroke="#FFB347" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
            <Line type="monotone" dataKey="inflationAdj" name="Inflation-adj" stroke="#6B7280" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>No projection data. Set up your budget first.</p>
      )}
    </motion.div>
  );
}
