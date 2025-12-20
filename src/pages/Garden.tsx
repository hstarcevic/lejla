import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Flower2 } from 'lucide-react';
import { Flower } from '../types';
import { useFlowers } from '../hooks/useLocalStorage';
import { generateId } from '../utils/storage';

const flowerEmojis = {
  rose: '🌹',
  tulip: '🌷',
  daisy: '🌼',
  lily: '💐',
  sunflower: '🌻',
};

const flowerColors = {
  rose: 'from-red-400 to-pink-500',
  tulip: 'from-pink-400 to-purple-500',
  daisy: 'from-yellow-300 to-orange-400',
  lily: 'from-purple-400 to-pink-500',
  sunflower: 'from-yellow-400 to-amber-500',
};

export default function Garden() {
  const { flowers, isLoading, addFlower, updateFlower, deleteFlower } = useFlowers();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);
  const [formData, setFormData] = useState({
    message: '',
    type: 'rose' as Flower['type'],
  });

  const resetForm = () => {
    setFormData({ message: '', type: 'rose' });
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message) return;

    const newFlower: Flower = {
      id: generateId(),
      message: formData.message,
      isBloomed: false,
      type: formData.type,
    };
    await addFlower(newFlower);
    resetForm();
  };

  const handleBloom = async (flower: Flower) => {
    if (!flower.isBloomed) {
      await updateFlower({ ...flower, isBloomed: true });
    }
    setSelectedFlower(flower);
  };

  const handleDelete = async (id: string) => {
    await deleteFlower(id);
    setSelectedFlower(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-xl text-primary-600">Love Garden</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-sm bg-primary-100 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Plant
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
            <label className="block text-sm text-gray-600 mb-2">Flower Type</label>
            <div className="flex gap-2 justify-center">
              {(Object.keys(flowerEmojis) as Flower['type'][]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type }))}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    formData.type === type
                      ? 'bg-primary-100 scale-110'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {flowerEmojis[type]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="A reason I love you..."
              rows={3}
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
          <p className="text-primary-300 mt-3">Loading garden...</p>
        </div>
      ) : flowers.length === 0 ? (
        <div className="text-center py-12 text-primary-300">
          <Flower2 className="w-12 h-12 mx-auto mb-3" />
          <p>Garden is empty</p>
          <p className="text-sm">Plant your first flower</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {flowers.map((flower, index) => (
            <motion.div
              key={flower.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: 'spring' }}
              onClick={() => handleBloom(flower)}
              className="aspect-square flex items-center justify-center cursor-pointer"
            >
              {flower.isBloomed ? (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-4xl"
                >
                  {flowerEmojis[flower.type]}
                </motion.span>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${flowerColors[flower.type]} opacity-50`}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Flower Message Modal */}
      <AnimatePresence>
        {selectedFlower && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFlower(null)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
            >
              <span className="text-5xl block mb-4">
                {flowerEmojis[selectedFlower.type]}
              </span>
              <p className="text-gray-600 mb-4">{selectedFlower.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(selectedFlower.id)}
                  className="flex-1 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedFlower(null)}
                  className="flex-1 py-2 text-sm bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
