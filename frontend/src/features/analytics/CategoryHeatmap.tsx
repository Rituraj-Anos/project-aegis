import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api/client';

interface HeatmapCell {
  name: string;
  size: number;
  intensity: number;
  [key: string]: unknown; // satisfy Recharts TreemapDataType index signature
}

function intensityToColor(intensity: number): string {
  if (intensity < 0.4) return `rgba(0,255,135,${0.3 + intensity * 0.7})`;
  if (intensity < 0.75) return `rgba(255,179,71,${0.4 + intensity * 0.5})`;
  return `rgba(255,107,107,${0.5 + intensity * 0.4})`;
}

function CustomContent(props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; intensity?: number; size?: number;
  [key: string]: unknown;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, intensity = 0, size = 0 } = props;
  if (width < 30 || height < 30) return null;
  const color = intensityToColor(intensity as number);
  return (
    <g>
      <rect x={x} y={y} width={width - 2} height={height - 2}
        fill={color} rx={8} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      {width > 60 && height > 40 && (
        <>
          <text x={x + 10} y={y + 22} fill="#EAEAEA" fontSize={12} fontWeight={600} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none' }}>
            {name}
          </text>
          {height > 56 && (
            <text x={x + 10} y={y + 38} fill="rgba(234,234,234,0.6)" fontSize={10} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none' }}>
              ₹{(size as number)?.toLocaleString('en-IN')}
            </text>
          )}
        </>
      )}
    </g>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: HeatmapCell }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'rgba(14,21,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
      <p style={{ color: '#EAEAEA', fontWeight: 600, marginBottom: '0.25rem' }}>{d.name}</p>
      <p style={{ color: 'var(--text-secondary)' }}>Spent: <span style={{ color: '#00FF87', fontWeight: 600 }}>₹{d.size?.toLocaleString('en-IN')}</span></p>
      <p style={{ color: 'var(--text-secondary)' }}>Intensity: <span style={{ color: intensityToColor(d.intensity as number), fontWeight: 600 }}>{Math.round((d.intensity as number) * 100)}%</span></p>
    </div>
  );
}

export default function CategoryHeatmap() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<HeatmapCell[]>({
    queryKey: ['category-heatmap'],
    queryFn: () => apiClient.get('/analytics/category-heatmap').then(r => r.data),
  });

  const handleClick = (node: { name?: string }) => {
    if (node?.name) navigate(`/transactions?category=${node.name.toLowerCase()}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#EAEAEA' }}>Spending Heatmap</h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#00FF87', display: 'inline-block' }} /> Low</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#FFB347', display: 'inline-block' }} /> Medium</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#FF6B6B', display: 'inline-block' }} /> High</span>
        </div>
      </div>
      {isLoading ? (
        <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
          style={{ height: 240, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }} />
      ) : !data?.length ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>No spending data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <Treemap
            data={data}
            dataKey="size"
            onClick={handleClick}
            content={<CustomContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      )}
      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.625rem' }}>Click a category to filter transactions</p>
    </motion.div>
  );
}
