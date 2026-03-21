import { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

type ToastType = 'error' | 'success';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  onRetry?: () => void;
}

// Simple external store so any hook can push toasts without prop drilling
let toasts: Toast[] = [];
let listeners: Set<() => void> = new Set();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

export function showToast(message: string, onRetry?: () => void, type: ToastType = 'error') {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, message, type, onRetry }];
  emitChange();

  setTimeout(() => {
    dismissToast(id);
  }, type === 'success' ? 3000 : 5000);
}

export function showSuccessToast(message: string) {
  showToast(message, undefined, 'success');
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default function ToastContainer() {
  const items = useToasts();

  return (
    <div className="fixed top-16 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence>
        {items.map((toast) => {
          const isSuccess = toast.type === 'success';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 shadow-lg flex items-start gap-3 border ${
                isSuccess
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
              }`}
            >
              {isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <p className={`text-sm flex-1 ${
                isSuccess ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>{toast.message}</p>
              <div className="flex gap-1 shrink-0">
                {toast.onRetry && (
                  <button
                    onClick={() => {
                      dismissToast(toast.id);
                      toast.onRetry?.();
                    }}
                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    title="Pokušaj ponovo"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => dismissToast(toast.id)}
                  className={`p-1 transition-colors ${
                    isSuccess
                      ? 'text-green-400 hover:text-green-600 dark:hover:text-green-300'
                      : 'text-red-400 hover:text-red-600 dark:hover:text-red-300'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
