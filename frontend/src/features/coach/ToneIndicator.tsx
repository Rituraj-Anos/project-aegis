import { motion } from 'framer-motion';
import type { CoachState } from '../../hooks/useCoach';

interface ToneIndicatorProps {
  coachState: CoachState;
  compact?: boolean;
}

const SEGMENTS: { level: 0 | 1 | 2; label: string; color: string }[] = [
  { level: 0, label: 'Gentle', color: '#00FF87' },
  { level: 1, label: 'Firm', color: '#FFB347' },
  { level: 2, label: 'Blunt', color: '#FF6B6B' },
];

export default function ToneIndicator({ coachState, compact = false }: ToneIndicatorProps) {
  if (compact) {
    return (
      <motion.div
        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        title={`Coach: ${coachState.label}`}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: coachState.color,
            boxShadow: `0 0 6px ${coachState.color}`,
          }}
        />
        <span style={{ fontSize: '0.75rem', color: coachState.color, fontWeight: 600 }}>
          {coachState.label}
        </span>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Coach Mode</span>
        <span style={{ fontSize: '0.75rem', color: coachState.color, fontWeight: 600 }}>{coachState.label}</span>
      </div>

      {/* Segmented bar */}
      <div style={{ display: 'flex', gap: '0.25rem', height: 6 }}>
        {SEGMENTS.map(seg => (
          <div key={seg.level} style={{ flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
            <motion.div
              animate={{ opacity: coachState.level === seg.level ? 1 : 0.15 }}
              transition={{ duration: 0.4 }}
              style={{
                position: 'absolute', inset: 0,
                background: seg.color,
                borderRadius: 3,
              }}
            />
            {/* Pulse on active segment */}
            {coachState.level === seg.level && (
              <motion.div
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  position: 'absolute', inset: 0,
                  background: seg.color,
                  borderRadius: 3,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {SEGMENTS.map(seg => (
          <span key={seg.level}
            style={{ fontSize: '0.625rem', color: coachState.level === seg.level ? seg.color : 'var(--text-tertiary)', fontWeight: coachState.level === seg.level ? 600 : 400, flex: 1, textAlign: seg.level === 0 ? 'left' : seg.level === 2 ? 'right' : 'center' }}>
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
