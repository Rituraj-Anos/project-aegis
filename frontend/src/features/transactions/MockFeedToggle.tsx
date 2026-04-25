import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../lib/api/client';

export default function MockFeedToggle() {
  const [active, setActive] = useState(false);
  const qc = useQueryClient();

  const { mutate: toggle, isPending } = useMutation({
    mutationFn: () =>
      active
        ? apiClient.post('/transactions/mock-feed/stop')
        : apiClient.post('/transactions/mock-feed'),
    onSuccess: () => {
      setActive((a) => !a);
      toast.success(active ? 'Mock feed stopped.' : 'Mock feed started — transactions incoming!');
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['recent-transactions'] });
    },
    onError: () => toast.error('Failed to toggle mock feed.'),
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#EAEAEA', marginBottom: '0.125rem' }}>Mock Transaction Feed</p>
        <p style={{ fontSize: '0.775rem', color: 'var(--text-tertiary)' }}>
          {active ? 'Simulated transactions are being generated in real-time.' : 'Enable to simulate impulse purchases for testing.'}
        </p>
      </div>

      {/* Toggle pill */}
      <motion.button
        disabled={isPending}
        onClick={() => toggle()}
        whileTap={{ scale: 0.93 }}
        style={{
          position: 'relative', width: 52, height: 28, borderRadius: 14,
          background: active ? '#00FF87' : 'rgba(255,255,255,0.1)',
          border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
          flexShrink: 0, padding: 0, outline: 'none',
          boxShadow: active ? '0 0 12px rgba(0,255,135,0.4)' : 'none',
          transition: 'background 0.2s, box-shadow 0.2s',
          opacity: isPending ? 0.6 : 1,
        }}
        aria-label="Toggle mock feed"
        role="switch"
        aria-checked={active}
      >
        <motion.div
          animate={{ x: active ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute', top: 2, left: 0,
            width: 24, height: 24, borderRadius: '50%',
            backgroundColor: active ? '#0A0F0D' : '#EAEAEA',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </motion.button>
    </div>
  );
}
