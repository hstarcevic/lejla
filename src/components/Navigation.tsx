import { motion } from 'framer-motion';
import { Clock, Mail, Flower2 } from 'lucide-react';
import { Page } from '../types';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const items = [
    { id: 'timeline' as Page, icon: Clock, label: 'Timeline' },
    { id: 'letters' as Page, icon: Mail, label: 'Letters' },
    { id: 'garden' as Page, icon: Flower2, label: 'Garden' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-primary-100 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="relative flex flex-col items-center py-2 px-4"
          >
            {currentPage === id && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 bg-primary-100 rounded-xl"
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <Icon
              className={`relative w-6 h-6 transition-colors ${
                currentPage === id ? 'text-primary-500' : 'text-gray-400'
              }`}
            />
            <span
              className={`relative text-xs mt-1 transition-colors ${
                currentPage === id ? 'text-primary-500 font-medium' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
