import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import apiClient from '../../lib/api/client';

interface CounterfactualData {
  savedToday: number;
  savedIn15Years: number;
  alertsIgnored: number;
  weeklyTimeline: {
    week: string;
    savedAmount: number;
    sipValue: number;
    sparkline: number[];
  }[];
}

function SpringCounter({ target, prefix = '₹', duration = 1400 }: { target: number; prefix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setDisplay(Math.round(ease * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return (
    <>{prefix}{display.toLocaleString('en-IN')}</>
  );
}

function SparkTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(14,21,18,0.95)', border: '1px solid rgba(0,255,135,0.2)', borderRadius: 8, padding: '0.375rem 0.625rem', fontSize: '0.75rem', color: '#00FF87' }}>
      ₹{payload[0].value?.toLocaleString('en-IN')}
    </div>
  );
}

export default function TimeMachinePanel() {
  const { data, isLoading } = useQuery<CounterfactualData>({
    queryKey: ['counterfactual'],
    queryFn: () => apiClient.get('/analytics/counterfactual').then(r => r.data),
  });

  const timeline = data?.weeklyTimeline ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero counter */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 22 }}
        style={{ background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.15)', borderRadius: 20, padding: '2rem' }}
      >
        <p style={{ fontSize: '0.875rem', color: 'rgba(0,255,135,0.7)', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          If you'd declined {data?.alertsIgnored ?? 0} impulse buys this week…
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '0.5rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(234,234,234,0.5)', marginBottom: '0.25rem' }}>Saved today</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, color: '#00FF87', lineHeight: 1, textShadow: '0 0 20px rgba(0,255,135,0.4)' }}
            >
              {isLoading ? '—' : <SpringCounter target={data?.savedToday ?? 0} />}
            </motion.p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(234,234,234,0.5)', marginBottom: '0.25rem' }}>In 15 years (SIP)</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, color: '#00FF87', lineHeight: 1, textShadow: '0 0 20px rgba(0,255,135,0.4)' }}
            >
              {isLoading ? '—' : <SpringCounter target={data?.savedIn15Years ?? 0} duration={1800} />}
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Weekly timeline */}
      <div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.875rem' }}>Weekly timeline</p>
        {isLoading ? (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map(i => (
              <motion.div key={i} animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
                style={{ flex: 1, height: 120, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
            No timeline data yet — keep using Aegis to build your history.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {timeline.map((week, i) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
                whileHover={{ scale: 1.03, borderColor: 'rgba(0,255,135,0.3)' }}
                style={{
                  flex: '0 0 160px', background: 'var(--surface-card)',
                  border: '1px solid var(--surface-border)', borderRadius: 14,
                  padding: '1rem', cursor: 'default',
                }}
              >
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.375rem' }}>{week.week}</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', fontWeight: 700, color: '#00FF87', marginBottom: '0.125rem' }}>
                  ₹{week.savedAmount.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                  → ₹{week.sipValue.toLocaleString('en-IN')} SIP
                </p>
                {week.sparkline?.length > 0 && (
                  <ResponsiveContainer width="100%" height={40}>
                    <AreaChart data={week.sparkline.map((v, j) => ({ v, j }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`sg-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00FF87" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00FF87" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip content={<SparkTooltip />} />
                      <Area type="monotone" dataKey="v" stroke="#00FF87" strokeWidth={1.5} fill={`url(#sg-${i})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
