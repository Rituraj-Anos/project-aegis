import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../lib/api/client';
import ThresholdSlider from './ThresholdSlider';

/* ── Schema — use z.number() (not coerce) so output types stay number ── */
const categoryLimitSchema = z.object({
  category: z.string().min(1, 'Category required'),
  limit: z.number().min(0, 'Must be ≥ 0'),
});

const budgetSchema = z.object({
  globalThreshold: z.number().min(1, 'Set a threshold > 0'),
  categoryLimits: z.array(categoryLimitSchema),
  sipRate: z.number().min(1).max(50),
  fdRate: z.number().min(1).max(30),
  inflationRate: z.number().min(0).max(20),
  timeHorizonYears: z.number().min(1).max(50),
});
type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetData extends BudgetFormData { id?: string; }

const CATEGORY_OPTIONS = ['food', 'shopping', 'entertainment', 'transport', 'health', 'utilities', 'education', 'travel', 'other'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.625rem 0.875rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, color: '#EAEAEA', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'var(--font-body)',
};

interface NumericFieldProps {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerReturn: any;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

function NumericField({ label, registerReturn, error, min, max, step, suffix }: NumericFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {/* valueAsNumber ensures RHF sends a number, not a string */}
        <input type="number" min={min} max={max} step={step ?? 0.1} {...registerReturn} style={inputStyle} />
        {suffix && (
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.8rem', pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{error}</p>}
    </div>
  );
}

export default function BudgetForm() {
  const qc = useQueryClient();

  const { data: existing } = useQuery<BudgetData>({
    queryKey: ['budget'],
    queryFn: () => apiClient.get('/budgets').then(r => r.data),
  });

  const { control, register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      globalThreshold: 5000,
      categoryLimits: [],
      sipRate: 12,
      fdRate: 7,
      inflationRate: 6,
      timeHorizonYears: 10,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'categoryLimits' });
  const threshold = watch('globalThreshold');

  useEffect(() => {
    if (existing) {
      setValue('globalThreshold', existing.globalThreshold);
      setValue('categoryLimits', existing.categoryLimits ?? []);
      setValue('sipRate', existing.sipRate ?? 12);
      setValue('fdRate', existing.fdRate ?? 7);
      setValue('inflationRate', existing.inflationRate ?? 6);
      setValue('timeHorizonYears', existing.timeHorizonYears ?? 10);
    }
  }, [existing, setValue]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (d: BudgetFormData) => apiClient.put('/budgets', d),
    onSuccess: () => {
      toast.success('Budget saved!');
      qc.invalidateQueries({ queryKey: ['budget'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => toast.error('Failed to save budget.'),
  });

  return (
    <form onSubmit={handleSubmit(d => save(d))} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Global threshold */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '1.25rem' }}>Monthly Budget Limit</h3>
        <Controller
          control={control}
          name="globalThreshold"
          render={() => (
            <ThresholdSlider
              label="Global spend threshold"
              value={threshold ?? 5000}
              onChange={(v) => setValue('globalThreshold', v)}
              min={0} max={200000} step={500} prefix="₹"
            />
          )}
        />
        {errors.globalThreshold && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>{errors.globalThreshold.message}</p>}
      </div>

      {/* Category limits */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#EAEAEA' }}>Category Limits</h3>
          <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => append({ category: 'food', limit: 2000 })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: 'rgba(0,255,135,0.1)', color: '#00FF87', border: '1px solid rgba(0,255,135,0.25)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.8125rem' }}>
            <Plus size={14} /> Add
          </motion.button>
        </div>

        <AnimatePresence>
          {fields.length === 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
              No category limits. Click "Add" to set per-category caps.
            </motion.p>
          )}
          {fields.map((field, i) => (
            <motion.div key={field.id}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Category</label>
                <select {...register(`categoryLimits.${i}.category`)}
                  style={{ ...inputStyle, padding: '0.625rem 0.75rem', cursor: 'pointer', appearance: 'none' }}>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Limit (₹)</label>
                {/* valueAsNumber keeps Zod happy with z.number() */}
                <input type="number" min={0} step={100} {...register(`categoryLimits.${i}.limit`, { valueAsNumber: true })} style={inputStyle} />
              </div>
              <motion.button type="button" whileHover={{ color: 'var(--danger)', scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => remove(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: '0.625rem', marginBottom: '0.125rem' }}>
                <Trash2 size={16} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* SIP/FD/Inflation rates — valueAsNumber on all numeric inputs */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '1.25rem' }}>Projection Rates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
          <NumericField label="SIP Rate" registerReturn={register('sipRate', { valueAsNumber: true })} suffix="%" min={1} max={50} error={errors.sipRate?.message} />
          <NumericField label="FD Rate" registerReturn={register('fdRate', { valueAsNumber: true })} suffix="%" min={1} max={30} error={errors.fdRate?.message} />
          <NumericField label="Inflation Rate" registerReturn={register('inflationRate', { valueAsNumber: true })} suffix="%" min={0} max={20} error={errors.inflationRate?.message} />
          <NumericField label="Time Horizon" registerReturn={register('timeHorizonYears', { valueAsNumber: true })} suffix="yrs" min={1} max={50} step={1} error={errors.timeHorizonYears?.message} />
        </div>
      </div>

      {/* Submit */}
      <motion.button type="submit" disabled={isPending}
        whileHover={!isPending ? { scale: 1.02, boxShadow: '0 0 24px rgba(0,255,135,0.25)' } : {}}
        whileTap={!isPending ? { scale: 0.98 } : {}}
        style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', background: '#00FF87', color: '#0A0F0D', border: 'none', borderRadius: 10, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9375rem', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}>
        {isPending
          ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #0A0F0D', borderTopColor: 'transparent', borderRadius: '50%' }} />
          : <Save size={16} />}
        {isPending ? 'Saving…' : 'Save Budget'}
      </motion.button>
    </form>
  );
}
