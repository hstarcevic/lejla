import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Page } from './types';
import { storage } from './utils/storage';
import PasswordGate from './components/PasswordGate';
import Navigation from './components/Navigation';
import Timeline from './pages/Timeline';
import Letters from './pages/Letters';
import Garden from './pages/Garden';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('timeline');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const authenticated = storage.isAuthenticated();
    const hasPassword = storage.getPassword();

    if (authenticated && hasPassword) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleAuthenticate = () => {
    setIsAuthenticated(true);
    storage.setAuthenticated(true);
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
    return <PasswordGate onAuthenticate={handleAuthenticate} />;
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-primary-100 px-4 py-3">
        <h1 className="text-center font-serif text-2xl text-primary-600">
          For Lejla
        </h1>
      </header>

      <main className="px-4 py-6">
        <AnimatePresence mode="wait">
          {currentPage === 'timeline' && <Timeline key="timeline" />}
          {currentPage === 'letters' && <Letters key="letters" />}
          {currentPage === 'garden' && <Garden key="garden" />}
        </AnimatePresence>
      </main>

      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

export default App;
