import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Flower2 } from 'lucide-react';
import { Flower } from '../types';
import { useFlowers } from '../hooks/useLocalStorage';
import { generateId } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { haptic } from '../utils/haptic';

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
  const { flowers, isLoading, isSyncing, addFlower, updateFlower, deleteFlower, refresh } = useFlowers();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    message: '',
    type: 'rose' as Flower['type'],
  });
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh(refresh);

  const stats = useMemo(() => {
    if (flowers.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const f of flowers) {
      counts[f.type] = (counts[f.type] || 0) + 1;
    }
    const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: flowers.length,
      bloomed: flowers.filter((f) => f.isBloomed).length,
      favoriteType: favorite[0] as Flower['type'],
    };
  }, [flowers]);

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
    haptic(20);
    if (!flower.isBloomed) {
      await updateFlower({ ...flower, isBloomed: true });
    }
    setSelectedFlower(flower);
  };

  const handleDelete = (id: string) => {
    haptic();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteFlower(deletingId);
      setDeletingId(null);
      setSelectedFlower(null);
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
        message="Jesi li sigurna da želiš obrisati ovaj cvijet?"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl text-primary-600 dark:text-primary-400">Bašta ljubavi</h2>
          {isSyncing && <div className="w-1.5 h-1.5 rounded-full bg-primary-300 animate-pulse" />}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Posadi
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
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Vrsta cvijeta</label>
            <div className="flex gap-2 justify-center">
              {(Object.keys(flowerEmojis) as Flower['type'][]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type }))}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    formData.type === type
                      ? 'bg-primary-100 dark:bg-primary-900/40 scale-110'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {flowerEmojis[type]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Poruka</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Razlog zašto te volim..."
              rows={3}
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
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : flowers.length === 0 ? (
        <div className="text-center py-12 text-primary-300">
          <Flower2 className="w-12 h-12 mx-auto mb-3" />
          <p>Bašta je prazna</p>
          <p className="text-sm">Posadi prvi cvijet</p>
        </div>
      ) : (
        <>
        {stats && (
          <div className="flex justify-center gap-4 mb-4 text-xs text-primary-500">
            <span>{stats.total} {stats.total === 1 ? 'cvijet' : stats.total < 5 ? 'cvijeta' : 'cvjetova'}</span>
            <span>·</span>
            <span>{stats.bloomed} procvjetalo</span>
            <span>·</span>
            <span>Najčešći: {flowerEmojis[stats.favoriteType]}</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {flowers.map((flower, index) => (
            <motion.div
              key={flower.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.05, 0.3), type: 'spring' }}
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
        </>
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
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
            >
              <span className="text-5xl block mb-4">
                {flowerEmojis[selectedFlower.type]}
              </span>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedFlower.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(selectedFlower.id)}
                  className="flex-1 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Obriši
                </button>
                <button
                  onClick={() => setSelectedFlower(null)}
                  className="flex-1 py-2 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                >
                  Zatvori
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
