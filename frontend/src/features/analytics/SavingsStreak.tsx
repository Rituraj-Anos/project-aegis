import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
import apiClient from '../../lib/api/client';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  dailyStatus: { date: string; underBudget: boolean }[];
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    start.current = null;
    const tick = (ts: number) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return <>{display}</>;
}

export default function SavingsStreak() {
  const { data, isLoading } = useQuery<StreakData>({
    queryKey: ['savings-streak'],
    queryFn: () => apiClient.get('/analytics/savings-streak').then(r => r.data),
  });

  const days = data?.dailyStatus?.slice(-28) ?? [];
  const streak = data?.currentStreak ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: '1.5rem' }}>

      {/* Header + counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '0.25rem' }}>Savings Streak</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Consecutive days under budget</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {isLoading ? (
            <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ width: 64, height: 36, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
          ) : (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 700, color: streak > 0 ? '#00FF87' : 'var(--text-secondary)', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <CountUp target={streak} />
                <Flame size={22} color={streak > 0 ? '#00FF87' : 'var(--text-tertiary)'} fill={streak > 6 ? '#00FF87' : 'transparent'} />
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                Best: {data?.longestStreak ?? 0} days
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* 28-day calendar heatmap */}
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.625rem' }}>Last 28 days</p>
        {isLoading ? (
          <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
            style={{ height: 52, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
            {days.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.015, type: 'spring', stiffness: 400, damping: 24 }}
                title={`${day.date}: ${day.underBudget ? 'Under budget ✅' : 'Over budget ❌'}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: 4,
                  background: day.underBudget ? 'rgba(0,255,135,0.5)' : 'rgba(255,107,107,0.3)',
                  boxShadow: day.underBudget ? '0 0 4px rgba(0,255,135,0.3)' : 'none',
                  cursor: 'default',
                }}
              />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.625rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(0,255,135,0.5)', display: 'inline-block' }} /> Under budget</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,107,107,0.3)', display: 'inline-block' }} /> Over budget</span>
        </div>
      </div>
    </motion.div>
  );
}
