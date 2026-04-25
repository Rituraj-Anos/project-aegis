import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../lib/api/client';
import { sanitizeText } from '../../utils/sanitize';

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  createdAt: string;
  isIntercepted: boolean;
  shadowValue?: number;
  description?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍔', shopping: '🛍️', entertainment: '🎬',
  transport: '🚗', health: '💊', utilities: '💡',
  education: '📚', travel: '✈️', other: '💳',
};

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 0.5rem', alignItems: 'center' }}>
      <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
        style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.1 }}
          style={{ height: 14, width: '55%', borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
        <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
          style={{ height: 11, width: '35%', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.15 }}
        style={{ height: 20, width: 70, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

export default function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const qc = useQueryClient();

  const { mutate: softDelete } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/transactions/${id}`),
    onMutate: async (id) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['transactions'] });
      const prev = qc.getQueryData(['transactions']);
      qc.setQueryData(['transactions'], (old: { data: Transaction[]; total: number } | undefined) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((t) => t.id !== id) };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['transactions'], ctx.prev);
      toast.error('Failed to delete transaction.');
    },
    onSuccess: () => {
      toast.success('Transaction removed.');
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</p>
        <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>No transactions found</p>
        <p style={{ fontSize: '0.8125rem' }}>Upload a CSV or adjust your filters.</p>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence initial={false}>
        {transactions.map((t, i) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 26 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.75rem 0.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Icon */}
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>
              {CATEGORY_EMOJI[t.category] ?? '💳'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#EAEAEA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sanitizeText(t.merchant)}
                </p>
                {t.isIntercepted && (
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-dim)', padding: '0.1rem 0.4rem', borderRadius: 3, flexShrink: 0, textTransform: 'uppercase' }}>
                    Flagged
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {sanitizeText(t.category)} · {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
              </p>
              {t.shadowValue != null && t.shadowValue > 0 && (
                <p style={{ fontSize: '0.7rem', color: 'rgba(0,255,135,0.7)', marginTop: '0.125rem' }}>
                  🌱 ₹{t.shadowValue.toLocaleString('en-IN')} in 10 yrs (SIP)
                </p>
              )}
            </div>

            {/* Amount & delete */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: t.isIntercepted ? 'var(--warning)' : '#EAEAEA' }}>
                ₹{t.amount.toLocaleString('en-IN')}
              </p>
              <motion.button
                whileHover={{ color: 'var(--danger)', scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => softDelete(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 4, borderRadius: 6 }}
              >
                <Trash2 size={15} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
