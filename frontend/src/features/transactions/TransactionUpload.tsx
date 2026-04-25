import { useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../lib/api/client';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export default function TransactionUpload() {
  const qc = useQueryClient();

  const { mutate: upload, isPending } = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post('/transactions/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (response) => {
      const importedCount = response.data?.data?.importedCount ?? response.data?.importedCount ?? 0;
      toast.success(`CSV uploaded! ${importedCount} transactions imported.`);
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['recent-transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => toast.error('Upload failed. Please check the file format.'),
  });

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      const code = rejected[0]?.errors?.[0]?.code;
      if (code === 'file-too-large') toast.error('File too large. Max size is 5 MB.');
      else if (code === 'file-invalid-type') toast.error('Only CSV files are accepted.');
      else toast.error('Invalid file.');
      return;
    }
    if (accepted[0]) upload(accepted[0]);
  }, [upload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, acceptedFiles } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isPending,
  });

  const uploaded = acceptedFiles[0];
  const borderColor = isDragReject ? 'var(--danger)' : isDragActive ? '#00FF87' : 'rgba(255,255,255,0.12)';

  return (
    // Plain div for getRootProps (avoids onAnimationStart collision with Framer Motion)
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${borderColor}`,
        borderRadius: 16,
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        background: isDragActive ? 'rgba(0,255,135,0.06)' : 'rgba(255,255,255,0.02)',
        boxShadow: isDragActive ? '0 0 24px rgba(0,255,135,0.2)' : 'none',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
      }}
    >
      <input {...getInputProps()} />
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 40, height: 40, border: '3px solid rgba(0,255,135,0.2)', borderTopColor: '#00FF87', borderRadius: '50%' }} />
            <p style={{ color: '#00FF87', fontSize: '0.9rem', fontWeight: 500 }}>Uploading…</p>
          </motion.div>
        ) : uploaded ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={32} color="#00FF87" />
            <p style={{ color: '#00FF87', fontWeight: 600, fontSize: '0.9rem' }}>{uploaded.name}</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{(uploaded.size / 1024).toFixed(1)} KB</p>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <motion.div animate={isDragActive ? { y: [-4, 0, -4] } : {}} transition={{ duration: 0.8, repeat: Infinity }}>
              {isDragReject
                ? <X size={36} color="var(--danger)" />
                : <Upload size={36} color={isDragActive ? '#00FF87' : 'var(--text-tertiary)'} />}
            </motion.div>
            <div>
              <p style={{ color: isDragActive ? '#00FF87' : '#EAEAEA', fontWeight: 500, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                {isDragReject ? 'Invalid file type' : isDragActive ? 'Drop to upload' : 'Drag & drop your CSV here'}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                or <span style={{ color: '#00FF87', fontWeight: 500 }}>click to browse</span> · CSV only · Max 5 MB
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.375rem 0.75rem', borderRadius: 6 }}>
              <FileText size={13} /> Exports from banks, Splitwise, or any standard CSV
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
