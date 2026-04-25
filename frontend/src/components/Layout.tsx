import { motion } from 'framer-motion';
import Navbar from './Navbar';

interface LayoutProps { children: React.ReactNode; }

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Navbar />
      <main className="page">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </>
  );
}
