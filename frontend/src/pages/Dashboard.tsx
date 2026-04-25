import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Flame, Shield, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import Layout from '../components/Layout';
import { apiGetDashboardStats } from '../mock/api';
import { COACH_CONFIG, CATEGORY_EMOJI, inr, buildProjectionPoints } from '../mock/data';

const projPoints = buildProjectionPoints(4200);

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, type: 'spring' as const, stiffness: 280, damping: 26 } }),
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: apiGetDashboardStats,
  });

  const coach = COACH_CONFIG[data?.coachState ?? 1];
  const pct = data ? Math.round((data.totalSpentThisMonth / data.budgetTotal) * 100) : 0;

  return (
    <Layout>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Good evening, Rituraj 👋
          </h1>
          <p style={{ color: 'var(--tx-2)', marginTop: '0.25rem', fontSize: '0.9rem' }}>April 2026 · Your shadow coach is watching.</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          {[
            { icon: TrendingUp, label: 'Total Spent', value: inr(data?.totalSpentThisMonth ?? 23850), sub: 'This month', color: 'var(--tx-1)' },
            { icon: Wallet,     label: 'Budget Remaining', value: inr(data?.budgetRemaining ?? 6150), sub: `of ${inr(data?.budgetTotal ?? 30000)}`, color: '#00FF87' },
            { icon: Flame,      label: 'Savings Streak', value: `${data?.savingsStreak ?? 3} days`, sub: 'Under budget', color: '#FFD16F' },
            { icon: Shield,     label: 'Coach State', value: coach.label, sub: 'Auto-adjusted', color: coach.color },
          ].map(({ icon: Icon, label, value, sub, color }, i) => (
            <motion.div key={label} className="card" custom={i} variants={cardVariants} initial="hidden" animate="show"
              whileHover={{ scale: 1.025, boxShadow: `0 0 24px ${color}18` }}
              style={{ padding: '1.5rem', cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
              </div>
              {isLoading
                ? <div className="skel" style={{ height: 28, width: '60%', marginBottom: '0.5rem' }} />
                : <p style={{ fontFamily: 'var(--font-head)', fontSize: '1.625rem', fontWeight: 700, color, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{value}</p>}
              <p style={{ fontSize: '0.75rem', color: 'var(--tx-3)' }}>{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Budget progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--tx-2)', fontWeight: 500 }}>Monthly Budget Usage</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: pct > 80 ? 'var(--danger)' : 'var(--green)' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--s-bright)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              style={{ height: '100%', borderRadius: 3, background: pct > 80 ? 'var(--danger)' : 'linear-gradient(90deg, #00FF87, #00C860)', boxShadow: '0 0 8px rgba(0,255,135,0.4)' }} />
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {/* Recent Transactions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Transactions</h2>
              <Link to="/transactions" style={{ fontSize: '0.8125rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {isLoading
                ? [1,2,3].map(i => <div key={i} className="skel" style={{ height: 48, borderRadius: 10 }} />)
                : (data?.recentTransactions ?? []).map((t, i) => (
                    <motion.div key={t._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.06 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem', background: 'var(--s-high)', borderRadius: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--s-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                        {CATEGORY_EMOJI[t.category] ?? '💳'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.merchantName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--tx-3)', marginTop: '0.1rem' }}>{formatDistanceToNow(new Date(t.timestamp), { addSuffix: true })}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: t.isIntercepted ? 'var(--danger)' : 'var(--tx-1)' }}>{inr(t.amount)}</p>
                        {t.isIntercepted && <span className="badge badge-danger" style={{ fontSize: '0.6rem', marginTop: '0.2rem' }}>Intercepted</span>}
                      </div>
                    </motion.div>
                  ))}
            </div>
          </motion.div>

          {/* Active Alerts */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Active Alerts</h2>
            {isLoading
              ? [1,2].map(i => <div key={i} className="skel" style={{ height: 80, borderRadius: 12 }} />)
              : (data?.activeAlerts ?? []).map((alert, i) => {
                  const cfg = COACH_CONFIG[alert.coachState];
                  return (
                    <motion.div key={alert._id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.08 }}
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--tx-2)', lineHeight: 1.5, marginBottom: '0.5rem' }}>{alert.message}</p>
                      <p style={{ fontSize: '0.75rem', color: cfg.color, fontWeight: 600 }}>🌱 {alert.shadowInsight}</p>
                    </motion.div>
                  );
                })}
          </motion.div>
        </div>

        {/* Mini Projection Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Shadow SIP Projection</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--tx-3)', marginTop: '0.2rem' }}>If ₹4,200/mo impulse spend was invested instead</p>
            </div>
            <Link to="/analytics" style={{ fontSize: '0.8125rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Full analytics <ArrowRight size={13} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={projPoints} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FF87" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00FF87" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip formatter={(v) => inr(Number(v))} labelFormatter={(l) => `Year ${l}`}
                contentStyle={{ background: 'var(--s-high)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="sip" stroke="#00FF87" strokeWidth={2} fill="url(#sipGrad)" dot={false} />
              <Area type="monotone" dataKey="fd" stroke="#FFD16F" strokeWidth={1.5} fill="none" strokeDasharray="4 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: 12, height: 2, background: 'var(--green)', display: 'inline-block', borderRadius: 1 }} /> SIP @ 12%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: 12, height: 2, background: 'var(--amber)', display: 'inline-block', borderRadius: 1 }} /> FD @ 6.5%</span>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
