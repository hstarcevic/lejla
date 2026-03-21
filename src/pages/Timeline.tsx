import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Trash2, Edit2, X, Check, Image, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { TimelineEntry } from '../types';
import { useTimeline } from '../hooks/useLocalStorage';
import { generateId, storage } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { haptic } from '../utils/haptic';

function TimelineCard({ entry, index, onEdit, onDelete, onPhotoClick }: {
  entry: TimelineEntry;
  index: number;
  onEdit: (entry: TimelineEntry) => void;
  onDelete: (id: string) => void;
  onPhotoClick: (src: string) => void;
}) {
  const [photo, setPhoto] = useState<string | undefined>(entry.photo);
  const [photoLoading, setPhotoLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entry.hasPhoto || entry.photo) return;

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          observer.disconnect();
          setPhotoLoading(true);
          storage.getTimelineEntryPhoto(entry.id).then((p) => {
            setPhoto(p);
            setPhotoLoading(false);
          });
        }
      },
      { rootMargin: '200px' }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [entry.id, entry.hasPhoto, entry.photo]);

  const staggerDelay = Math.min(index * 0.1, 0.5);

  return (
    <motion.div
      ref={cardRef}
      key={entry.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: staggerDelay }}
      className="relative pl-10"
    >
      <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary-400 border-2 border-white dark:border-gray-900 shadow" />
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md shadow-primary-50 dark:shadow-gray-900/50">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-primary-400">
              {new Date(entry.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h3 className="font-serif text-lg text-primary-600 dark:text-primary-400">{entry.title}</h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 text-gray-400 hover:text-primary-500 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {photoLoading && (
          <div className="w-full h-48 rounded-lg mb-2 bg-primary-50 dark:bg-gray-700 animate-pulse" />
        )}
        {photo && (
          <img
            src={photo}
            alt={entry.title}
            onClick={() => onPhotoClick(photo)}
            className="w-full h-48 object-cover rounded-lg mb-2 cursor-pointer active:opacity-80"
          />
        )}
        {entry.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{entry.description}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function Timeline() {
  const { entries, isLoading, isSyncing, addEntry, updateEntry, deleteEntry, refresh, page, setPage, totalPages } = useTimeline();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [photoStatus, setPhotoStatus] = useState<null | 'compressing' | 'ready'>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    photo: '',
  });
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh(refresh);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) => e.title.toLowerCase().includes(q) || e.date.includes(q)
    );
  }, [entries, searchQuery]);

  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: TimelineEntry[] }[] = [];
    let currentLabel = '';
    for (const entry of filteredEntries) {
      const d = new Date(entry.date);
      const label = d.toLocaleDateString('bs-BA', { year: 'numeric', month: 'long' });
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, entries: [entry] });
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [filteredEntries]);

  const resetForm = () => {
    setFormData({ date: '', title: '', description: '', photo: '' });
    setIsAdding(false);
    setEditingId(null);
    setPhotoStatus(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoStatus('compressing');
    const img = new window.Image();
    img.onload = () => {
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      setFormData((prev) => ({ ...prev, photo: compressed }));
      setPhotoStatus('ready');
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.title) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateEntry({
          id: editingId,
          ...formData,
        });
      } else {
        const newEntry: TimelineEntry = {
          id: generateId(),
          ...formData,
        };
        await addEntry(newEntry);
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: TimelineEntry) => {
    setFormData({
      date: entry.date,
      title: entry.title,
      description: entry.description,
      photo: entry.photo || '',
    });
    setEditingId(entry.id);
    setIsAdding(true);
    setPhotoStatus(entry.photo ? 'ready' : null);
  };

  const handleDelete = (id: string) => {
    haptic();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteEntry(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div ref={containerRef}>
      {/* Pull-to-refresh indicator */}
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
        message="Jesi li sigurna da želiš obrisati ovu uspomenu?"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl text-primary-600 dark:text-primary-400">Naša priča</h2>
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

      {!isLoading && entries.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pretraži uspomene..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-primary-200 dark:border-gray-700 focus:border-primary-400 outline-none bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {isAdding && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg shadow-primary-100 dark:shadow-gray-900/50 mb-6 space-y-3"
        >
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Datum</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-gray-700 focus:border-primary-400 outline-none bg-white dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Naslov</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Prvi dejt, Prvi poljubac..."
              className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-gray-700 focus:border-primary-400 outline-none bg-white dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Opis</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Ispričaj priču..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-gray-700 focus:border-primary-400 outline-none resize-none bg-white dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Slika</label>
            <label className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed border-primary-300 dark:border-gray-600 cursor-pointer hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors">
              {photoStatus === 'compressing' ? (
                <>
                  <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                  <span className="text-sm text-primary-500">Kompresija...</span>
                </>
              ) : (
                <>
                  <Image className="w-5 h-5 text-primary-400" />
                  <span className="text-sm text-primary-500">
                    {formData.photo ? 'Promijeni sliku' : 'Dodaj sliku'}
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={photoStatus === 'compressing'}
              />
            </label>
            {formData.photo && (
              <img
                src={formData.photo}
                alt="Preview"
                className="mt-2 w-full h-32 object-cover rounded-lg"
              />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <X className="w-4 h-4 mx-auto" />
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{formData.photo ? 'Slanje...' : 'Čuvanje...'}</span>
                </>
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-100 dark:from-gray-700 to-secondary-100 dark:to-gray-800" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative pl-10 animate-pulse">
                <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary-200 dark:bg-gray-600" />
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md shadow-primary-50 dark:shadow-gray-900/50">
                  <div className="h-3 w-24 bg-primary-100 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-5 w-40 bg-primary-100 dark:bg-gray-700 rounded mb-3" />
                  <div className="w-full h-48 bg-primary-50 dark:bg-gray-700 rounded-lg mb-2" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-primary-300">
          <Calendar className="w-12 h-12 mx-auto mb-3" />
          <p>Još nema uspomena</p>
          <p className="text-sm">Dodaj prvu uspomenu</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-primary-300">
          <Search className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Nema rezultata</p>
        </div>
      ) : (
        <>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 dark:from-primary-800 to-secondary-300 dark:to-secondary-800" />

            <div className="space-y-6">
              {groupedEntries.map((group) => (
                <div key={group.label}>
                  <div className="relative pl-10 mb-3">
                    <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide">{group.label}</p>
                  </div>
                  {group.entries.map((entry, index) => (
                    <div key={entry.id} className="mb-6 last:mb-0">
                      <TimelineCard
                        entry={entry}
                        index={index}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPhotoClick={(src) => { haptic(); setLightboxPhoto(src); }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
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

      {/* Photo Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={lightboxPhoto}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
