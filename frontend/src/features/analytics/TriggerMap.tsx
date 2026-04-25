import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '../../lib/api/client';

interface TriggerWindow { hour: number; day: number; riskScore: number; triggerType: string; }

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function riskColor(score: number): string {
  if (score < 25) return 'rgba(0,255,135,0.6)';
  if (score < 50) return 'rgba(255,179,71,0.65)';
  if (score < 75) return 'rgba(255,107,107,0.6)';
  return 'rgba(255,107,107,0.95)';
}

function riskLabel(score: number) {
  if (score < 25) return 'Low';
  if (score < 50) return 'Medium';
  if (score < 75) return 'High';
  return 'Critical';
}

export default function TriggerMap() {
  const { data, isLoading } = useQuery<TriggerWindow[]>({
    queryKey: ['trigger-map'],
    queryFn: () => apiClient.get('/analytics/trigger-map').then(r => r.data),
  });

  // Build lookup: day-hour → riskScore
  const lookup = new Map<string, { riskScore: number; triggerType: string }>();
  (data ?? []).forEach(w => lookup.set(`${w.day}-${w.hour}`, { riskScore: w.riskScore, triggerType: w.triggerType }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '0.25rem' }}>Risk Trigger Map</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Hours × days when impulse spending is most likely</p>
      </div>

      {isLoading ? (
        <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
          style={{ height: 180, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(24, 1fr)`, gap: 3, minWidth: 600 }}>
            {/* Header row — hours */}
            <div />
            {HOURS.map(h => (
              <div key={h} style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', textAlign: 'center', paddingBottom: 2 }}>
                {h % 6 === 0 ? `${h}h` : ''}
              </div>
            ))}

            {/* Day rows */}
            {DAYS.map((day, dayIdx) => (
              <>
                <div key={`label-${day}`} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', paddingRight: 4 }}>
                  {day}
                </div>
                {HOURS.map((hour, hIdx) => {
                  const cell = lookup.get(`${dayIdx}-${hour}`);
                  const score = cell?.riskScore ?? 0;
                  return (
                    <motion.div
                      key={`${dayIdx}-${hour}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (dayIdx * 24 + hIdx) * 0.002, type: 'spring', stiffness: 400, damping: 20 }}
                      title={score > 0 ? `${day} ${hour}:00 — Risk: ${riskLabel(score)} (${score}) · ${cell?.triggerType ?? ''}` : `${day} ${hour}:00 — Low risk`}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 3,
                        background: score > 0 ? riskColor(score) : 'rgba(255,255,255,0.04)',
                        cursor: score > 0 ? 'help' : 'default',
                      }}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
        {[{ label: 'Low', color: 'rgba(0,255,135,0.6)' }, { label: 'Medium', color: 'rgba(255,179,71,0.65)' }, { label: 'High', color: 'rgba(255,107,107,0.6)' }, { label: 'Critical', color: 'rgba(255,107,107,0.95)' }].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />{l.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
