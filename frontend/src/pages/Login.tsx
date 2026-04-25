import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiLogin } from '../mock/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});
type Form = z.infer<typeof schema>;

// Floating orb config
const ORBS = [
  { x: '10%', y: '20%', size: 280, color: 'rgba(0,255,135,0.06)', dur: 8 },
  { x: '75%', y: '60%', size: 350, color: 'rgba(0,255,135,0.04)', dur: 11 },
  { x: '50%', y: '10%', size: 200, color: 'rgba(255,209,111,0.04)', dur: 9 },
  { x: '20%', y: '75%', size: 240, color: 'rgba(0,255,135,0.03)', dur: 13 },
];

export default function Login() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (d: Form) => {
    await apiLogin(d.email, d.password);
    toast.success('Welcome back, Rituraj 👋');
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>

      {/* Floating orbs */}
      {ORBS.map((orb, i) => (
        <motion.div key={i}
          style={{ position: 'absolute', left: orb.x, top: orb.y, width: orb.size, height: orb.size, borderRadius: '50%', background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`, pointerEvents: 'none' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Card */}
        <div className="glass" style={{ borderRadius: 20, padding: '2.5rem' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em' }}>AEGIS</span>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 10px rgba(0,255,135,0.8)' }} />
            </motion.div>
            <p style={{ color: 'var(--tx-2)', fontSize: '0.9rem' }}>Your shadow budget coach</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                <input className="input" type="email" placeholder="Email address" {...register('email')} style={{ paddingLeft: '2.5rem' }} />
              </div>
              {errors.email && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.375rem' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Password" {...register('password')} style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--tx-3)', cursor: 'pointer', display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.375rem' }}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.02, boxShadow: '0 0 28px rgba(0,255,135,0.4)' } : {}}
              whileTap={!isSubmitting ? { scale: 0.97 } : {}}
              className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', position: 'relative', overflow: 'hidden' }}>
              {isSubmitting ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #0A0F0D', borderTopColor: 'transparent', borderRadius: '50%' }} />
              ) : 'Sign In'}
            </motion.button>

            {/* Google OAuth */}
            <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="btn-ghost" style={{ width: '100%' }}
              onClick={() => toast('Google OAuth coming soon 🔜', { icon: '🚧' })}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--tx-3)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--green)', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
