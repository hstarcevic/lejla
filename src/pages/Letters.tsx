import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mail, MailOpen, X, Check, Trash2 } from 'lucide-react';
import { Letter } from '../types';
import { useLetters } from '../hooks/useLocalStorage';
import { generateId } from '../utils/storage';

export default function Letters() {
  const { letters, isLoading, addLetter, updateLetter, deleteLetter } = useLetters();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

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
    if (!letter.isOpened) {
      await updateLetter({ ...letter, isOpened: true });
    }
    setSelectedLetter(letter);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteLetter(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-xl text-primary-600">Ljubavna pisma</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-sm bg-primary-100 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-200 transition-colors"
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
          className="bg-white rounded-xl p-4 shadow-lg shadow-primary-100 mb-6 space-y-3"
        >
          <div>
            <label className="block text-sm text-gray-600 mb-1">Naslov</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Pismo za tebe..."
              className="w-full px-3 py-2 rounded-lg border border-primary-200 focus:border-primary-400 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Sadržaj</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Piši od srca..."
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-primary-200 focus:border-primary-400 outline-none resize-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
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
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto"></div>
          <p className="text-primary-300 mt-3">Učitavanje pisama...</p>
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-12 text-primary-300">
          <Mail className="w-12 h-12 mx-auto mb-3" />
          <p>Još nema pisama</p>
          <p className="text-sm">Napiši prvo ljubavno pismo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {letters.map((letter, index) => (
            <motion.div
              key={letter.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              onClick={() => handleOpen(letter)}
              className="relative bg-white rounded-xl p-4 shadow-md shadow-primary-50 cursor-pointer hover:shadow-lg transition-shadow"
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
                <h3 className="font-medium text-sm text-primary-600 line-clamp-2">
                  {letter.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
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
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-serif text-xl text-primary-600">{selectedLetter.title}</h3>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="prose prose-sm text-gray-600 whitespace-pre-wrap">
                {selectedLetter.content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
