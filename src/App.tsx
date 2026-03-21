import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { Page } from './types';
import { storage } from './utils/storage';
import PasswordGate from './components/PasswordGate';
import Navigation from './components/Navigation';
import ToastContainer from './components/Toast';
import Timeline from './pages/Timeline';
import Letters from './pages/Letters';
import Garden from './pages/Garden';
import { useDarkMode } from './hooks/useDarkMode';

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const pageOrder: Page[] = ['timeline', 'letters', 'garden'];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('timeline');
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark, toggle: toggleDark } = useDarkMode();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = storage.isAuthenticated();
    const password = await storage.getPassword();

    if (authenticated && password) {
      setIsAuthenticated(true);
    }
    setHasExistingPassword(!!password);
    setIsLoading(false);
  };

  const handleAuthenticate = () => {
    setIsAuthenticated(true);
    storage.setAuthenticated(true);
  };

  const handleNavigate = (page: Page) => {
    const oldIdx = pageOrder.indexOf(currentPage);
    const newIdx = pageOrder.indexOf(page);
    setDirection(newIdx - oldIdx);
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary-400">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticate={handleAuthenticate} hasExistingPassword={hasExistingPassword} />;
  }

  return (
    <div className="min-h-screen pb-20" style={{ overscrollBehaviorY: 'contain' }}>
      <ToastContainer />
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-primary-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-center relative">
          <h1 className="text-center font-serif text-2xl text-primary-600 dark:text-primary-400">
            Lejla & Hamza ❤️
          </h1>
          <button
            onClick={toggleDark}
            className="absolute right-0 p-1.5 text-primary-400 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-200 transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-center text-xs text-primary-400 dark:text-primary-500 mt-0.5">
          {(() => {
            const diff = Math.floor((Date.now() - new Date('2025-09-14').getTime()) / 86_400_000);
            return diff >= 0 ? `${diff} dana zajedno` : `još ${Math.abs(diff)} dana`;
          })()}
        </p>
      </header>

      <main className="px-4 py-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {currentPage === 'timeline' && <Timeline />}
            {currentPage === 'letters' && <Letters />}
            {currentPage === 'garden' && <Garden />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
