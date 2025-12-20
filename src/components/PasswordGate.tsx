import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lock } from 'lucide-react';
import { storage } from '../utils/storage';

interface PasswordGateProps {
  onAuthenticate: () => void;
}

export default function PasswordGate({ onAuthenticate }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [error, setError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    checkPassword();
  }, []);

  const checkPassword = async () => {
    const storedPassword = await storage.getPassword();
    if (!storedPassword) {
      setIsSettingPassword(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSettingPassword) {
      if (password.length < 4) {
        setError('Lozinka mora imati najmanje 4 znaka');
        return;
      }
      if (password !== confirmPassword) {
        setError('Lozinke se ne podudaraju');
        return;
      }
      await storage.setPassword(password);
      onAuthenticate();
    } else {
      const storedPassword = await storage.getPassword();
      if (password === storedPassword) {
        onAuthenticate();
      } else {
        setError('Netačna lozinka');
        setPassword('');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <Heart className="w-16 h-16 text-primary-400 mx-auto" fill="currentColor" />
          </motion.div>
          <h1 className="font-serif text-3xl text-primary-600 mt-4">Lejla & Hamza ❤️</h1>
          <p className="text-primary-400 mt-2">
            {isSettingPassword ? 'Postavi lozinku za zaštitu uspomena' : 'Unesi lozinku za nastavak'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSettingPassword ? 'Kreiraj lozinku' : 'Lozinka'}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white/50"
              autoFocus
            />
          </div>

          {isSettingPassword && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Potvrdi lozinku"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white/50"
              />
            </div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary-400 to-secondary-400 text-white rounded-xl font-medium hover:from-primary-500 hover:to-secondary-500 transition-all shadow-lg shadow-primary-200"
          >
            {isSettingPassword ? 'Postavi lozinku' : 'Uđi'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
