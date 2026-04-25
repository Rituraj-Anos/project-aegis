import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import CoachOverlay from './components/CoachOverlay';
import { mockAlerts, mockUser } from './mock/data';
import type { MockAlert } from './mock/data';
import './index.css';

const Login      = lazy(() => import('./pages/Login'));
const Register   = lazy(() => import('./pages/Register'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Analytics  = lazy(() => import('./pages/Analytics'));
const TimeMachine = lazy(() => import('./pages/TimeMachine'));
const Settings   = lazy(() => import('./pages/Settings'));
const NotFound   = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 0 } },
});

function Spinner() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 40, height: 40, border: '3px solid rgba(0,255,135,0.15)', borderTopColor: '#00FF87', borderRadius: '50%' }} />
    </div>
  );
}

export default function App() {
  const [activeAlert, setActiveAlert] = useState<MockAlert | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/login"        element={<Login />} />
            <Route path="/register"     element={<Register />} />
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics"    element={<Analytics />} />
            <Route path="/time-machine" element={<TimeMachine />} />
            <Route path="/settings"     element={<Settings />} />
            <Route path="/"             element={<Navigate to="/dashboard" replace />} />
            <Route path="*"             element={<NotFound />} />
          </Routes>
        </Suspense>

        {/* ── Coach Overlay ── */}
        <AnimatePresence>
          {activeAlert && (
            <CoachOverlay
              alert={activeAlert}
              coachState={mockUser.coachState}
              onClose={() => setActiveAlert(null)}
            />
          )}
        </AnimatePresence>

        {/* ── Test Coach Alert Button (mock build only) ── */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 300 }}
          whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(255,209,111,0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveAlert(mockAlerts[0])}
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 300,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'var(--amber-dim)',
            border: '1px solid var(--amber-border)',
            borderRadius: 'var(--r-pill)',
            color: 'var(--amber)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
          title="Test Coach Alert (mock build)"
        >
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Zap size={15} />
          </motion.span>
          Test Coach Alert
        </motion.button>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--s-high)',
              color: 'var(--tx-1)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#00FF87', secondary: '#0A0F0D' } },
            error: { iconTheme: { primary: '#FF6B6B', secondary: '#0A0F0D' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
