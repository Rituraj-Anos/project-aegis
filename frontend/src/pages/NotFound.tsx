import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem', textAlign: 'center', overflow: 'hidden' }}>

      {/* Ambient glow */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* 404 glitch text */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        style={{ position: 'relative', marginBottom: '1.5rem' }}
      >
        <motion.h1
          animate={{ textShadow: ['0 0 0px transparent', '0 0 20px rgba(0,255,135,0.5)', '0 0 0px transparent'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(6rem, 20vw, 10rem)', fontWeight: 900, color: '#00FF87', lineHeight: 1, letterSpacing: '-0.04em' }}
        >
          404
        </motion.h1>
        {/* Glitch layer */}
        <motion.h1
          animate={{ x: [-2, 2, -2, 0], opacity: [0, 0.3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          aria-hidden
          style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(6rem, 20vw, 10rem)', fontWeight: 900, color: '#FF6B6B', lineHeight: 1, letterSpacing: '-0.04em', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          404
        </motion.h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
        style={{ fontFamily: 'var(--font-heading)', fontSize: '1.375rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '0.625rem' }}
      >
        Page not found
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: 380, lineHeight: 1.6, marginBottom: '2.5rem' }}
      >
        This page doesn't exist, or you may have followed a broken link. Let's get you back on track.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(0,255,135,0.35)' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/dashboard')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', background: '#00FF87', color: '#0A0F0D', border: 'none', borderRadius: 12, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
      >
        <Home size={18} /> Back to Dashboard
      </motion.button>
    </div>
  );
}
