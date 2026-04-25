import { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)',
            padding: '2rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            style={{
              background: 'var(--surface-card)',
              border: '1px solid rgba(255,107,107,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem',
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--danger-dim)',
                marginBottom: '1.25rem',
              }}
            >
              <AlertTriangle size={28} color="var(--danger)" />
            </motion.div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                marginBottom: '0.75rem',
                color: 'var(--text-primary)',
              }}
            >
              Something went wrong
            </h2>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                marginBottom: '0.5rem',
                lineHeight: 1.6,
              }}
            >
              An unexpected error occurred. This has been noted.
            </p>

            {this.state.error && (
              <code
                style={{
                  display: 'block',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  fontSize: '0.7rem',
                  color: 'var(--danger)',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: 120,
                  fontFamily: 'var(--font-mono)',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </code>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={this.handleRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.75rem',
                background: 'var(--accent-green)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <RefreshCw size={16} />
              Try again
            </motion.button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
