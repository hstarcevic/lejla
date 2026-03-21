import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mail, MailOpen, X, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Letter } from '../types';
import { useLetters } from '../hooks/useLocalStorage';
import { generateId } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { haptic } from '../utils/haptic';

export default function Letters() {
  const { letters, isLoading, isSyncing, addLetter, updateLetter, deleteLetter, refresh, page, setPage, totalPages } = useLetters();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFirstOpen, setIsFirstOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh(refresh);

  const resetForm = () => {
    setFormData({ title: '', content: '' });
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    const newLetter: Letter = {
      id: generateId(),
      title: formData.title,
      content: formData.content,
      isOpened: false,
      createdAt: new Date().toISOString(),
    };
    await addLetter(newLetter);
    resetForm();
  };

  const handleOpen = async (letter: Letter) => {
    haptic(20);
    const opening = !letter.isOpened;
    if (opening) {
      await updateLetter({ ...letter, isOpened: true });
    }
    setIsFirstOpen(opening);
    setSelectedLetter(letter);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteLetter(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div ref={containerRef}>
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex justify-center overflow-hidden transition-all"
          style={{ height: pullDistance }}
        >
          <div className={`text-primary-400 text-sm ${isRefreshing ? 'animate-pulse' : ''}`}>
            {isRefreshing ? 'Osvježavanje...' : pullDistance >= 80 ? 'Pusti za osvježavanje' : 'Povuci za osvježavanje'}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        message="Jesi li sigurna da želiš obrisati ovo pismo?"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl text-primary-600 dark:text-primary-400">Ljubavna pisma</h2>
          {isSyncing && <div className="w-1.5 h-1.5 rounded-full bg-primary-300 animate-pulse" />}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>
        )}
      </div>

      {isAdding && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg shadow-primary-100 dark:shadow-gray-900/50 mb-6 space-y-3"
        >
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Naslov</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Pismo za tebe..."
              className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-gray-700 focus:border-primary-400 outline-none bg-white dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Sadržaj</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Piši od srca..."
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-gray-700 focus:border-primary-400 outline-none resize-none bg-white dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 mx-auto" />
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500"
            >
              <Check className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md shadow-primary-50 dark:shadow-gray-900/50 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-20 bg-primary-100 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-12 text-primary-300">
          <Mail className="w-12 h-12 mx-auto mb-3" />
          <p>Još nema pisama</p>
          <p className="text-sm">Napiši prvo ljubavno pismo</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {letters.map((letter, index) => (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                onClick={() => handleOpen(letter)}
                className="relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md shadow-primary-50 dark:shadow-gray-900/50 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <button
                  onClick={(e) => handleDelete(letter.id, e)}
                  className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="flex flex-col items-center text-center">
                  {letter.isOpened ? (
                    <MailOpen className="w-8 h-8 text-primary-300 mb-2" />
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Mail className="w-8 h-8 text-primary-400 mb-2" />
                    </motion.div>
                  )}
                  <h3 className="font-medium text-sm text-primary-600 dark:text-primary-400 line-clamp-2">
                    {letter.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-primary-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Letter Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={isFirstOpen ? { scale: 0.6, rotateX: 90 } : { scale: 0.9, y: 20 }}
              animate={{ scale: 1, rotateX: 0, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={isFirstOpen ? { type: 'spring', stiffness: 200, damping: 20 } : undefined}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              style={{ perspective: 800 }}
            >
              {isFirstOpen && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-center mb-2"
                >
                  <Mail className="w-10 h-10 text-primary-400 mx-auto" />
                </motion.div>
              )}
              <motion.div
                initial={isFirstOpen ? { opacity: 0, y: 10 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0 }}
                transition={isFirstOpen ? { delay: 0.5 } : undefined}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-serif text-xl text-primary-600 dark:text-primary-400">{selectedLetter.title}</h3>
                  <button
                    onClick={() => setSelectedLetter(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="prose prose-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedLetter.content}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
