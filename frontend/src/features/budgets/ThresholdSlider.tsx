import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThresholdSliderProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  prefix?: string;
}

export default function ThresholdSlider({
  value, onChange, min = 0, max = 100000, step = 500, label = 'Threshold', prefix = '₹',
}: ThresholdSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const raw = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, raw));
    const snapped = Math.round((clamped * (max - min) + min) / step) * step;
    onChange(Math.max(min, Math.min(max, snapped)));
  }, [isDragging, max, min, onChange, step]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
        <motion.span
          animate={{ color: isDragging ? '#00FF87' : '#EAEAEA' }}
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem' }}
        >
          {prefix}{value.toLocaleString('en-IN')}
        </motion.span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerMove={handlePointerMove}
        onPointerUp={() => { setIsDragging(false); setShowTooltip(false); }}
        onPointerLeave={() => { setIsDragging(false); setShowTooltip(false); }}
        style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', cursor: 'pointer', userSelect: 'none' }}
        onClick={(e) => {
          if (!trackRef.current) return;
          const rect = trackRef.current.getBoundingClientRect();
          const raw = (e.clientX - rect.left) / rect.width;
          const snapped = Math.round((raw * (max - min) + min) / step) * step;
          onChange(Math.max(min, Math.min(max, snapped)));
        }}
      >
        {/* Fill */}
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, rgba(0,255,135,0.6), #00FF87)', boxShadow: '0 0 8px rgba(0,255,135,0.4)' }}
        />

        {/* Thumb */}
        <motion.div
          animate={{ left: `${pct * 100}%`, scale: isDragging ? 1.3 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setIsDragging(true); setShowTooltip(true); }}
          style={{
            position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
            width: 18, height: 18, borderRadius: '50%',
            background: '#00FF87',
            boxShadow: isDragging ? '0 0 0 4px rgba(0,255,135,0.25), 0 0 12px rgba(0,255,135,0.5)' : '0 0 0 2px rgba(0,255,135,0.3)',
            cursor: 'grab',
            zIndex: 2,
          }}
        >
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                style={{
                  position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(14,21,18,0.95)', border: '1px solid rgba(0,255,135,0.3)',
                  borderRadius: 8, padding: '0.375rem 0.625rem',
                  fontSize: '0.8125rem', fontWeight: 600, color: '#00FF87',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {prefix}{value.toLocaleString('en-IN')}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Min/Max labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{prefix}{min.toLocaleString('en-IN')}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{prefix}{max.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
