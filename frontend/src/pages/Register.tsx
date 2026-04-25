import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRegister } from '../mock/api';

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });
type Form = z.infer<typeof schema>;

function pwStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const S_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const S_COLORS = ['', '#FF6B6B', '#FFB347', '#FFD16F', '#00FF87'];

export default function Register() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const pw = watch('password') ?? '';
  const strength = pwStrength(pw);

  const onSubmit = async (d: Form) => {
    await apiRegister(d.name, d.email, d.password);
    toast.success('Account created! Welcome to Aegis 🌱');
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <motion.div style={{ position: 'absolute', left: '75%', top: '10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 70%)', pointerEvents: 'none' }}
        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 9, repeat: Infinity }} />
      <motion.div style={{ position: 'absolute', left: '5%', top: '60%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,209,111,0.04) 0%, transparent 70%)', pointerEvents: 'none' }}
        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 12, repeat: Infinity }} />

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div className="glass" style={{ borderRadius: 20, padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em' }}>AEGIS</span>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 10px rgba(0,255,135,0.8)' }} />
            </div>
            <p style={{ color: 'var(--tx-2)', fontSize: '0.9rem' }}>Start your financial journey</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
              <input className="input" placeholder="Full name" {...register('name')} style={{ paddingLeft: '2.5rem' }} />
              {errors.name && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
            </div>

            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
              <input className="input" type="email" placeholder="Email address" {...register('email')} style={{ paddingLeft: '2.5rem' }} />
              {errors.email && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
            </div>

            <div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Password (min 8 chars)" {...register('password')} style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--tx-3)', cursor: 'pointer', display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pw.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ height: 3, background: 'var(--s-high)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${(strength / 4) * 100}%`, background: S_COLORS[strength] }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      style={{ height: '100%', borderRadius: 2 }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', marginTop: '0.2rem', color: S_COLORS[strength], fontWeight: 600 }}>{S_LABELS[strength]}</p>
                </div>
              )}
              {errors.password && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password.message}</p>}
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
              <input className="input" type="password" placeholder="Confirm password" {...register('confirmPassword')} style={{ paddingLeft: '2.5rem' }} />
              {errors.confirmPassword && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.confirmPassword.message}</p>}
            </div>

            <motion.button type="submit" disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.02, boxShadow: '0 0 28px rgba(0,255,135,0.4)' } : {}}
              whileTap={!isSubmitting ? { scale: 0.97 } : {}}
              className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {isSubmitting
                ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #0A0F0D', borderTopColor: 'transparent', borderRadius: '50%' }} />
                : 'Create Account'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--tx-3)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--green)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
