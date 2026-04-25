import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import apiClient from '../../lib/api/client';

interface WeeklyReportData {
  weekLabel: string;
  totalSpent: number;
  budgetLimit: number;
  percentUsed: number;
  topCategory: string;
  coachStateHistory: { date: string; state: 0 | 1 | 2 }[];
  dailySpend: { day: string; amount: number }[];
}

const COACH_LABELS = ['Gentle', 'Firm', 'Blunt'];
const COACH_COLORS = ['#00FF87', '#FFB347', '#FF6B6B'];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(14,21,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ color: '#00FF87', fontWeight: 600 }}>₹{payload[0].value?.toLocaleString('en-IN')}</p>
    </div>
  );
}

export default function WeeklyReport() {
  const { data, isLoading } = useQuery<WeeklyReportData>({
    queryKey: ['weekly-report'],
    queryFn: () => apiClient.get('/analytics/weekly-report').then(r => r.data),
  });

  const overBudget = (data?.percentUsed ?? 0) > 100;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '0.125rem' }}>Weekly Report</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{data?.weekLabel ?? 'This week'}</p>
        </div>
        {!isLoading && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: 8, background: overBudget ? 'var(--danger-dim)' : 'var(--accent-green-dim)', color: overBudget ? 'var(--danger)' : '#00FF87', fontSize: '0.8rem', fontWeight: 600 }}>
            {overBudget ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.round(data?.percentUsed ?? 0)}% of budget
          </motion.div>
        )}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {[
          { label: 'Total Spent', value: isLoading ? '…' : `₹${(data?.totalSpent ?? 0).toLocaleString('en-IN')}`, color: '#EAEAEA' },
          { label: 'Budget Limit', value: isLoading ? '…' : `₹${(data?.budgetLimit ?? 0).toLocaleString('en-IN')}`, color: 'var(--text-secondary)' },
          { label: 'Top Category', value: isLoading ? '…' : (data?.topCategory ?? '—'), color: '#EAEAEA' },
          { label: 'Coach Changes', value: isLoading ? '…' : String(data?.coachStateHistory?.length ?? 0), color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{s.label}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily bar chart */}
      {!isLoading && (data?.dailySpend ?? []).length > 0 && (
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.625rem' }}>Daily spend this week</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={data?.dailySpend} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barSize={22}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {data?.dailySpend.map((entry, i) => (
                  <Cell key={i} fill={entry.amount > (data.budgetLimit / 7) ? '#FF6B6B' : '#00FF87'} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Coach state history */}
      {(data?.coachStateHistory ?? []).length > 0 && (
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Coach state changes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {data!.coachStateHistory.slice(0, 4).map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{h.date}</span>
                <span style={{ color: COACH_COLORS[h.state], fontWeight: 600, background: `${COACH_COLORS[h.state]}20`, padding: '0.1rem 0.5rem', borderRadius: 4 }}>
                  {COACH_LABELS[h.state]}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
