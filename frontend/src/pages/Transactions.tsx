import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Upload, Play, Square, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { apiGetTransactions, generateRandomTransaction } from '../mock/api';
import { CATEGORY_EMOJI, inr, mockShadow } from '../mock/data';
import type { MockTransaction } from '../mock/data';

const CATEGORIES = ['All', 'Food', 'Shopping', 'Entertainment', 'Transport', 'Health', 'Utilities'];

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = { mock_api: 'badge-amber', csv: 'badge-green', manual: 'badge-gray' };
  return <span className={`badge ${map[source] ?? 'badge-gray'}`}>{source.replace('_', ' ')}</span>;
}

function ShadowInline({ amount }: { amount: number }) {
  const sipVal = Math.round(amount * Math.pow(1.12, mockShadow.timeHorizonYears));
  return (
    <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem', whiteSpace: 'nowrap' }}>
      🌱 {inr(amount)} = {inr(sipVal)} in 10y
    </span>
  );
}

function DropZone() {
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) toast.success('CSV uploaded (mock) — 3 transactions imported');
    else toast.error('Only CSV files accepted');
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false });
  return (
    <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'var(--green)' : 'var(--border-hi)'}`, borderRadius: 'var(--r-card)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'var(--green-dim)' : 'var(--s-low)', transition: 'border-color 0.2s, background 0.2s' }}>
      <input {...getInputProps()} />
      <Upload size={24} color={isDragActive ? 'var(--green)' : 'var(--tx-3)'} style={{ marginBottom: '0.5rem' }} />
      <p style={{ color: isDragActive ? 'var(--green)' : 'var(--tx-2)', fontSize: '0.875rem', fontWeight: 500 }}>
        {isDragActive ? 'Drop to import' : 'Drag & drop CSV or click to browse'}
      </p>
      <p style={{ color: 'var(--tx-3)', fontSize: '0.75rem', marginTop: '0.25rem' }}>CSV only · Max 5 MB</p>
    </div>
  );
}

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [feedActive, setFeedActive] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', category, search],
    queryFn: () => apiGetTransactions(category === 'All' ? '' : category, search),
  });

  const [localTxs, setLocalTxs] = useState<MockTransaction[]>([]);
  const allTxs = [...localTxs, ...(data?.data ?? [])];

  // Mock feed interval
  useEffect(() => {
    if (!feedActive) return;
    toast.success('Mock feed started — new transactions every 5s');
    const id = setInterval(() => {
      const tx = generateRandomTransaction();
      setLocalTxs(prev => [tx, ...prev]);
      toast(`New: ${tx.merchantName} · ${inr(tx.amount)}`, { icon: '⚡' });
    }, 5000);
    return () => { clearInterval(id); };
  }, [feedActive]);

  const toggleFeed = () => {
    if (feedActive) { toast('Mock feed stopped'); setFeedActive(false); }
    else setFeedActive(true);
  };

  return (
    <Layout>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Transactions</h1>
          <p style={{ color: 'var(--tx-2)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Your complete spending ledger</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Main list */}
          <div>
            {/* Filter bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                <input className="input" placeholder="Search merchant…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem', height: 42 }} />
              </div>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ height: 42, padding: '0 1rem', background: 'var(--s-high)', border: '1px solid var(--border)', borderRadius: 'var(--r-input)', color: 'var(--tx-1)', fontSize: '0.875rem', cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={toggleFeed}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', height: 42, borderRadius: 'var(--r-pill)', border: `1px solid ${feedActive ? 'var(--danger-dim)' : 'var(--green-border)'}`, background: feedActive ? 'var(--danger-dim)' : 'var(--green-dim)', color: feedActive ? 'var(--danger)' : 'var(--green)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                {feedActive ? <><Square size={13} /> Stop Feed</> : <><Play size={13} /> Mock Feed</>}
              </motion.button>
            </motion.div>

            {/* Transaction rows */}
            <AnimatePresence>
              {isLoading
                ? [1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 72, borderRadius: 12, marginBottom: '0.75rem' }} />)
                : allTxs.map((t, i) => (
                    <motion.div key={t._id}
                      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, height: 0 }}
                      transition={{ delay: i < 8 ? i * 0.05 : 0, type: 'spring', stiffness: 300, damping: 28 }}
                      className="card"
                      style={{ padding: '1rem 1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--s-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                        {CATEGORY_EMOJI[t.category] ?? '💳'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{t.merchantName}</p>
                          <SourceBadge source={t.source} />
                          {t.isIntercepted && <span className="badge badge-danger">Intercepted</span>}
                        </div>
                        <p style={{ color: 'var(--tx-3)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                          {t.category} · {formatDistanceToNow(new Date(t.timestamp), { addSuffix: true })}
                        </p>
                        {t.isIntercepted && <ShadowInline amount={t.amount} />}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.0625rem', color: t.isIntercepted ? 'var(--danger)' : 'var(--tx-1)' }}>{inr(t.amount)}</p>
                      </div>
                    </motion.div>
                  ))}
            </AnimatePresence>
            {!isLoading && allTxs.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--tx-3)' }}>
                <X size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                <p>No transactions match your filters.</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Import CSV</h3>
              <DropZone />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 }} className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Summary</h3>
              {[
                { label: 'Total transactions', val: allTxs.length },
                { label: 'Intercepted', val: allTxs.filter(t => t.isIntercepted).length },
                { label: 'Total spent', val: inr(allTxs.reduce((s, t) => s + t.amount, 0)) },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--tx-2)' }}>{label}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
              {feedActive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <motion.span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px var(--green)' }}
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>Live feed active</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
