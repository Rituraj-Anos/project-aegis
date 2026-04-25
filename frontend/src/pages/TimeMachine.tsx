import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import Layout from '../components/Layout';
import { apiGetCounterfactual } from '../mock/api';
import { inr } from '../mock/data';

// Count-up hook
function useCountUp(target: number, dur = 2000, delay = 400) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const pct = Math.min(elapsed / dur, 1);
        // ease-out-cubic
        const eased = 1 - Math.pow(1 - pct, 3);
        setVal(Math.round(eased * target));
        if (pct < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, dur, delay]);
  return val;
}

// Floating particles
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 3,
  dur: 6 + Math.random() * 8,
  delay: Math.random() * 4,
}));

// Build dual-line compounding chart (actual vs potential)
const actualBase = 23450;
const potBase = 284600;
const chartData = Array.from({ length: 16 }, (_, yr) => ({
  year: `'${(11 + yr).toString().padStart(2, '0')}`,
  actual: Math.round(actualBase * Math.pow(1.06, yr)),
  potential: Math.round(potBase * Math.pow(1.12, yr)),
}));

export default function TimeMachine() {
  const { data } = useQuery({ queryKey: ['counterfactual'], queryFn: apiGetCounterfactual });
  const saved15y = useCountUp(data?.savedIn15Years ?? 284600, 2200, 600);
  const savedToday = useCountUp(data?.savedToday ?? 23450, 1800, 800);

  return (
    <Layout>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Particle background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          {PARTICLES.map(p => (
            <motion.div key={p.id}
              style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: '50%', background: 'rgba(0,255,135,0.35)' }}
              animate={{ y: [-10, 10, -10], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 250, damping: 26 }}
            style={{ textAlign: 'center', padding: '3rem 0 2.5rem' }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              ⏰ Financial Time Machine
            </motion.p>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem', lineHeight: 1.15 }}>
              Your financial time machine
            </h1>
            <p style={{ color: 'var(--tx-2)', fontSize: '1rem', maxWidth: 480, margin: '0 auto 2.5rem' }}>
              See what your impulse spend <em>could have built</em> if invested instead.
            </p>

            {/* Hero counters */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
              {[
                { val: saved15y, label: 'Could have in 15 years', color: 'var(--green)', prefix: '₹' },
                { val: savedToday, label: 'Impulse spend to date', color: 'var(--amber)', prefix: '₹' },
                { val: data?.alertsIgnored ?? 4, label: 'Alerts ignored', color: 'var(--danger)', prefix: '' },
              ].map(({ val, label, color, prefix }) => (
                <motion.div key={label} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }}
                  style={{ textAlign: 'center' }}>
                  <motion.p style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {prefix}{val.toLocaleString('en-IN')}
                  </motion.p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--tx-3)', marginTop: '0.375rem' }}>{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CompoundingDelta Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Compounding Delta</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--tx-3)', marginBottom: '1.25rem' }}>Actual trajectory vs. what could have been</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF87" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00FF87" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A7ACA9" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#A7ACA9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fill: 'var(--tx-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => inr(Number(v))} contentStyle={{ background: 'var(--s-high)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="potential" name="What could be" stroke="#00FF87" strokeWidth={2.5} fill="url(#potGrad)" dot={false} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#A7ACA9" strokeWidth={1.5} fill="url(#actGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weekly cards horizontal scroll */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Week-by-Week Impact</h2>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {[
                { week: 'Apr 7–13', saved: 4200, sip: 41800 },
                { week: 'Apr 14–20', saved: 8900, sip: 88500 },
                { week: 'Apr 21–25', saved: 23450, sip: 233200 },
                { week: 'Projected', saved: 31000, sip: 308400, projected: true },
              ].map((w, i) => (
                <motion.div key={w.week} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 + i * 0.08 }}
                  className="card" style={{ minWidth: 200, padding: '1.25rem', flexShrink: 0, borderColor: w.projected ? 'var(--green-border)' : undefined, background: w.projected ? 'var(--green-dim)' : undefined }}>
                  <p style={{ fontSize: '0.75rem', color: w.projected ? 'var(--green)' : 'var(--tx-3)', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {w.projected ? '📈 ' : ''}{w.week}
                  </p>
                  <p style={{ fontFamily: 'var(--font-head)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>{inr(w.saved)}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--tx-3)', marginBottom: '0.625rem' }}>Impulse spend</p>
                  <p style={{ fontFamily: 'var(--font-head)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--green)' }}>{inr(w.sip)}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--tx-3)' }}>SIP value in 10yr</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
