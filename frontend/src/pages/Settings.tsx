import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Save, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { apiUpdateProfile, apiUpdateCoachState, apiDeleteAccount } from '../features/users/api';
import { COACH_CONFIG } from '../mock/data';
import { useAuth } from '../auth/AuthProvider';

const profileSchema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Valid email required'),
});
type ProfileForm = z.infer<typeof profileSchema>;

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [typed, setTyped] = useState('');
  const ready = typed === 'CONFIRM';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: '1.5rem' }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        style={{ background: 'var(--s-mid)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 20, padding: '2rem', maxWidth: 400, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} color="var(--danger)" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Delete Account</h3>
        </div>
        <p style={{ color: 'var(--tx-2)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          This will permanently delete all your data. Type <strong style={{ color: 'var(--tx-1)' }}>CONFIRM</strong> to proceed.
        </p>
        <input className="input" placeholder="CONFIRM" value={typed} onChange={e => setTyped(e.target.value)} style={{ marginBottom: '1.25rem', letterSpacing: '0.05em' }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onCancel}
            className="btn-ghost" style={{ flex: 1 }}>Cancel</motion.button>
          <motion.button whileHover={ready ? { scale: 1.02 } : {}} whileTap={ready ? { scale: 0.97 } : {}}
            disabled={!ready} onClick={onConfirm}
            style={{ flex: 1, padding: '0.75rem', background: ready ? 'var(--danger)' : 'rgba(255,107,107,0.15)', border: 'none', borderRadius: 'var(--r-pill)', color: ready ? '#fff' : 'rgba(255,107,107,0.4)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: ready ? 'pointer' : 'not-allowed' }}>
            Delete forever
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const [coachLevel, setCoachLevel] = useState<0 | 1 | 2>(user?.coachState ?? 0);
  const [showDelete, setShowDelete] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  const onSaveProfile = async (d: ProfileForm) => {
    await apiUpdateProfile(d);
    await refreshUser();
    toast.success('Profile updated!');
  };

  const onCoachChange = async (level: 0 | 1 | 2) => {
    setCoachLevel(level);
    await apiUpdateCoachState(level);
    await refreshUser();
    toast.success(`Coach mode set to ${COACH_CONFIG[level].label}`);
  };

  const onDeleteConfirm = async () => {
    setShowDelete(false);
    await apiDeleteAccount();
    toast.success('Account deleted');
    logout();
  };

  return (
    <Layout>
      <div className="container" style={{ maxWidth: 720 }}>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ color: 'var(--tx-2)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage your account and preferences</p>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Profile</h2>
          <form onSubmit={handleSubmit(onSaveProfile)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--tx-2)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                <input className="input" {...register('name')} style={{ paddingLeft: '2.5rem' }} />
              </div>
              {errors.name && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--tx-2)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                <input className="input" type="email" {...register('email')} style={{ paddingLeft: '2.5rem' }} />
              </div>
              {errors.email && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
            </div>
            <motion.button type="submit" disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.02, boxShadow: '0 0 20px rgba(0,255,135,0.25)' } : {}}
              whileTap={!isSubmitting ? { scale: 0.97 } : {}}
              className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              {isSubmitting
                ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #0A0F0D', borderTopColor: 'transparent', borderRadius: '50%' }} />
                : <><Save size={14} /> Save Changes</>}
            </motion.button>
          </form>
        </motion.div>

        {/* Coach mode */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Coach Mode</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--tx-3)', marginBottom: '1.25rem' }}>Choose how assertively AEGIS intervenes</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {([0, 1, 2] as const).map(level => {
              const cfg = COACH_CONFIG[level];
              const active = coachLevel === level;
              return (
                <motion.button key={level} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => onCoachChange(level)}
                  style={{ flex: 1, padding: '0.875rem', background: active ? cfg.bg : 'transparent', border: `1px solid ${active ? cfg.border : 'var(--border)'}`, borderRadius: 12, color: active ? cfg.color : 'var(--tx-2)', fontFamily: 'var(--font-body)', fontWeight: active ? 700 : 400, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}>
                  {cfg.label}
                  {active && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '0.65rem', color: cfg.color, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>● Active</motion.p>}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: 'var(--danger-dim)', border: '1px solid rgba(255,107,107,0.18)', borderRadius: 'var(--r-card)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.5rem' }}>Danger Zone</h2>
          <p style={{ color: 'var(--tx-2)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Permanently delete your account and all data. This is <strong style={{ color: 'var(--tx-1)' }}>irreversible</strong>.
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowDelete(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 'var(--r-pill)', color: 'var(--danger)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            <Trash2 size={15} /> Delete My Account
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDelete && <DeleteModal onConfirm={onDeleteConfirm} onCancel={() => setShowDelete(false)} />}
      </AnimatePresence>
    </Layout>
  );
}
