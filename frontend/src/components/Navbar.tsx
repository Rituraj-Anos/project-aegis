import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowLeftRight, BarChart2, Clock, Settings } from 'lucide-react';
import { mockUser, COACH_CONFIG } from '../mock/data';

const NAV_LINKS = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', Icon: ArrowLeftRight },
  { to: '/analytics',    label: 'Analytics',    Icon: BarChart2 },
  { to: '/time-machine', label: 'Time Machine', Icon: Clock },
  { to: '/settings',     label: 'Settings',     Icon: Settings },
];

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const coach = COACH_CONFIG[mockUser.coachState];

export default function Navbar() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  if (isAuthPage) return null;

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 'var(--nav-h)',
        background: 'rgba(15,21,18,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 1.75rem',
        gap: '1rem',
      }}
    >
      {/* Logo */}
      <NavLink to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', flexShrink: 0 }}>
        <motion.div whileHover={{ scale: 1.05 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.04em', color: 'var(--tx-1)' }}>
            AEGIS
          </span>
          <motion.span
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 8px rgba(0,255,135,0.7)' }}
          />
        </motion.div>
      </NavLink>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ color: 'var(--tx-1)' }}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: 8, color: isActive ? 'var(--tx-1)' : 'var(--tx-3)', fontWeight: isActive ? 600 : 400, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <Icon size={15} />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    style={{ position: 'absolute', inset: 0, background: 'var(--s-high)', borderRadius: 8, zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: 'var(--green)', borderRadius: 2, boxShadow: 'var(--green-glow)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Right side: ToneIndicator + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
        {/* Tone badge */}
        <motion.div
          animate={{ boxShadow: mockUser.coachState === 1
            ? ['0 0 0 rgba(255,209,111,0)', '0 0 12px rgba(255,209,111,0.4)', '0 0 0 rgba(255,209,111,0)']
            : [] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--r-pill)', background: coach.bg, border: `1px solid ${coach.border}`, fontSize: '0.75rem', fontWeight: 700, color: coach.color }}
        >
          <motion.span style={{ width: 6, height: 6, borderRadius: '50%', background: coach.color, display: 'inline-block' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          {coach.label}
        </motion.div>

        {/* Avatar */}
        <motion.div whileHover={{ scale: 1.06 }}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #00FF87, #00C860)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '0.8125rem', color: '#0A0F0D', cursor: 'pointer', flexShrink: 0 }}>
          {initials(mockUser.name)}
        </motion.div>
      </div>
    </motion.nav>
  );
}
