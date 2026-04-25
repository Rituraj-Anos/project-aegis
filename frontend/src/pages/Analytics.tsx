import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Treemap, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import Layout from '../components/Layout';
import { apiGetAnalytics } from '../mock/api';
import { buildProjectionPoints, inr } from '../mock/data';

const TABS = ['Overview', 'Projections', 'Triggers'] as const;
type Tab = typeof TABS[number];

const projData = buildProjectionPoints(4200);

// ── Treemap custom content ──
function TreeCell(props: { x?: number; y?: number; width?: number; height?: number; name?: string; value?: number; fill?: string; [k: string]: unknown }) {
  const { x = 0, y = 0, width = 0, height = 0, name, value, fill } = props;
  if (width < 30 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width - 2} height={height - 2} fill={fill ?? '#333'} fillOpacity={0.85} rx={8} />
      {width > 60 && height > 40 && (
        <>
          <text x={x + 10} y={y + 22} fill="#F9FDF9" fontSize={12} fontWeight={600} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none' }}>{name}</text>
          {height > 50 && <text x={x + 10} y={y + 38} fill="rgba(249,253,249,0.6)" fontSize={10} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none' }}>{inr(value ?? 0)}</text>}
        </>
      )}
    </g>
  );
}

// ── TriggerMap grid ──
const HOURS = [8,10,12,14,16,18,20,22,0];
const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function TriggerMapGrid({ triggers }: { triggers: { hour: number; day: string; riskScore: number }[] }) {
  const getRisk = (h: number, d: string) => triggers.find(t => t.hour === h && t.day === d)?.riskScore ?? 0;
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)`, gap: 4, minWidth: 500 }}>
        <div />
        {HOURS.map(h => <div key={h} style={{ fontSize: '0.65rem', color: 'var(--tx-3)', textAlign: 'center', paddingBottom: 4 }}>{h === 0 ? '12a' : h >= 12 ? `${h === 12 ? 12 : h - 12}p` : `${h}a`}</div>)}
        {DAYS.map(day => (
          <>
            <div key={day + '-label'} style={{ fontSize: '0.7rem', color: 'var(--tx-3)', display: 'flex', alignItems: 'center' }}>{day}</div>
            {HOURS.map(h => {
              const risk = getRisk(h, day);
              const alpha = risk > 0 ? 0.15 + (risk / 100) * 0.75 : 0.06;
              return (
                <motion.div key={`${day}-${h}`} whileHover={{ scale: 1.2 }} title={risk > 0 ? `Risk: ${risk}%` : undefined}
                  style={{ height: 28, borderRadius: 4, background: risk > 60 ? `rgba(255,107,107,${alpha})` : risk > 0 ? `rgba(255,209,111,${alpha})` : 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`, cursor: risk > 0 ? 'pointer' : 'default' }} />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [tab, setTab] = useState<Tab>('Overview');
  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: apiGetAnalytics });

  return (
    <Layout>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Analytics</h1>
          <p style={{ color: 'var(--tx-2)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Decode your spending patterns</p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', background: 'var(--s-low)', padding: '0.375rem', borderRadius: 12, width: 'fit-content' }}>
          {TABS.map(t => (
            <motion.button key={t} onClick={() => setTab(t)}
              style={{ position: 'relative', padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: 'none', color: tab === t ? 'var(--tx-1)' : 'var(--tx-3)', fontFamily: 'var(--font-body)', fontWeight: tab === t ? 600 : 400, fontSize: '0.875rem', cursor: 'pointer' }}>
              {tab === t && <motion.div layoutId="tab-bg" style={{ position: 'absolute', inset: 0, background: 'var(--s-high)', borderRadius: 8, zIndex: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} />}
              <span style={{ position: 'relative', zIndex: 1 }}>{t}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'Overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              {/* Heatmap */}
              <div className="card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Category Spend Heatmap</h3>
                {isLoading ? <div className="skel" style={{ height: 220 }} /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <Treemap data={data?.categoryHeatmap.map(d => ({ ...d, size: d.value }))} dataKey="size" content={<TreeCell />}>
                      <Tooltip formatter={(v) => inr(Number(v))} contentStyle={{ background: 'var(--s-high)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem' }} />
                    </Treemap>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Weekly spend bar */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Weekly Spend</h3>
                {isLoading ? <div className="skel" style={{ height: 180 }} /> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data?.weeklySpend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: 'var(--tx-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--tx-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => inr(Number(v))} contentStyle={{ background: 'var(--s-high)', border: '1px solid var(--border)', borderRadius: 10 }} />
                      <Bar dataKey="amount" fill="#00FF87" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Savings streak */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Savings Streak</h3>
                {isLoading ? <div className="skel" style={{ height: 80 }} /> : (
                  <>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 800, color: 'var(--green)' }}>{data?.savingsStreak.currentStreak}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--tx-3)', marginTop: '0.1rem' }}>Current streak</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 800, color: 'var(--tx-2)' }}>{data?.savingsStreak.longestStreak}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--tx-3)', marginTop: '0.1rem' }}>Longest ever</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {data?.savingsStreak.weeklyData.map((d, i) => (
                        <motion.div key={d.day} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: d.underBudget ? 'var(--green-dim)' : 'var(--danger-dim)', border: `1px solid ${d.underBudget ? 'var(--green-border)' : 'rgba(255,107,107,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                            {d.underBudget ? '✅' : '❌'}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--tx-3)' }}>{d.day.slice(0, 1)}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'Projections' && (
            <motion.div key="proj" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>10-Year Shadow SIP Projection</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--tx-3)', marginBottom: '1.25rem' }}>If ₹4,200/mo impulse spend was invested instead</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projData} margin={{ top: 4, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: 'var(--tx-3)', fontSize: 11 }} tickFormatter={v => `Yr ${v}`} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--tx-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => inr(Number(v))} labelFormatter={l => `Year ${l}`} contentStyle={{ background: 'var(--s-high)', border: '1px solid var(--border)', borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--tx-2)', paddingTop: '1rem' }} />
                  <Line type="monotone" dataKey="sip" name="SIP @ 12%" stroke="#00FF87" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="fd" name="FD @ 6.5%" stroke="#FFD16F" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                  <Line type="monotone" dataKey="inflationAdj" name="Real return" stroke="#A7ACA9" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {tab === 'Triggers' && (
            <motion.div key="triggers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>Impulse Trigger Map</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--tx-3)', marginBottom: '1.25rem' }}>Hour × Day risk grid — darker = higher impulse risk</p>
              {isLoading ? <div className="skel" style={{ height: 200 }} /> : <TriggerMapGrid triggers={data?.triggerMap ?? []} />}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                {[{ c: 'rgba(255,209,111,0.5)', l: 'Medium risk' }, { c: 'rgba(255,107,107,0.6)', l: 'High risk' }].map(({ c, l }) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--tx-3)' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} /> {l}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
