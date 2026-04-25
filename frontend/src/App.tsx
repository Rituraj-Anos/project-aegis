import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import CoachOverlay from './components/CoachOverlay';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './auth/AuthProvider';
import { useSocket } from './hooks/useSocket';
import { apiGetAiInsight } from './features/analytics/api';
import './index.css';

const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const Transactions  = lazy(() => import('./pages/Transactions'));
const Analytics     = lazy(() => import('./pages/Analytics'));
const TimeMachine   = lazy(() => import('./pages/TimeMachine'));
const Settings      = lazy(() => import('./pages/Settings'));
const NotFound      = lazy(() => import('./pages/NotFound'));

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

// ── Alert type for socket-delivered coach interventions ──
export interface CoachAlert {
  _id: string;
  amount: number;
  description: string;
  coachState: 0 | 1 | 2;
  tone: string;
  message: string;
  shadowInsight: string;
  projectedSIP: number;
  projectedFD: number;
  projectedInflationAdj: number;
}

function AppShell() {
  const [activeAlert, setActiveAlert] = useState<CoachAlert | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handler = (alert: CoachAlert) => setActiveAlert(alert);
    socket.on('coach:alert', handler);
    return () => { socket.off('coach:alert', handler); };
  }, [socket]);

  const handleTestAlert = async () => {
    try {
      const { default: apiClient } = await import('./lib/api/client');
      const txRes = await apiClient.get<{ data: { transactions: any[] } }>('/transactions', { params: { limit: 1, sortBy: 'date', sortOrder: 'desc' } });
      const tx = Array.isArray(txRes.data?.data?.transactions) && txRes.data.data.transactions.length > 0 ? txRes.data.data.transactions[0] : null;

      if (!tx) {
        toast.error("No transactions found to simulate alert.");
        return;
      }

      const placeholder: CoachAlert = {
        _id: 'dev-test',
        amount: tx.amount,
        description: `${tx.merchantName || 'Unknown'} · ${tx.category || 'Shopping'}`,
        coachState: 1,
        tone: 'firm',
        message: "Generating AI insight...",
        shadowInsight: `₹${tx.amount} invested monthly = ₹${Math.round(tx.amount * Math.pow(1.12, 10))} in 10 years (SIP @ 12%)`,
        projectedSIP: Math.round(tx.amount * Math.pow(1.12, 10)),
        projectedFD: Math.round(tx.amount * Math.pow(1.065, 10)),
        projectedInflationAdj: Math.round(tx.amount * Math.pow(1.065, 10) / Math.pow(1.06, 10)),
      };
      setActiveAlert(placeholder);

      const res = await apiClient.post('/analytics/ai-insight', {
        type: 'coach_alert',
        amount: tx.amount,
        category: tx.category || 'Shopping',
        merchantName: tx.merchantName,
        coachState: 1,
        weeklySpend: 18500
      });
      setActiveAlert({ ...placeholder, message: res.data?.data?.insight || 'Keep saving!' });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate AI insight.");
    }
  };

  return (
    <>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />
          <Route path="/dashboard"    element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
          <Route path="/analytics"    element={<RequireAuth><Analytics /></RequireAuth>} />
          <Route path="/time-machine" element={<RequireAuth><TimeMachine /></RequireAuth>} />
          <Route path="/settings"     element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/"             element={<Navigate to="/dashboard" replace />} />
          <Route path="*"             element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* ── Coach Overlay — triggered by real socket events ── */}
      <AnimatePresence>
        {activeAlert && (
          <CoachOverlay
            alert={activeAlert}
            coachState={activeAlert.coachState}
            onClose={() => setActiveAlert(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Dev-only: simulate a coach alert ── */}
      {import.meta.env.DEV && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 300 }}
          whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(255,209,111,0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTestAlert}
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
          title="Test Coach Alert (dev only)"
        >
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Zap size={15} />
          </motion.span>
          Test Coach Alert
        </motion.button>
      )}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
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
