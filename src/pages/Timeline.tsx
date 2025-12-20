import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Trash2, Edit2, X, Check, Image } from 'lucide-react';
import { TimelineEntry } from '../types';
import { useTimeline } from '../hooks/useLocalStorage';
import { generateId } from '../utils/storage';

export default function Timeline() {
  const { entries, isLoading, addEntry, updateEntry, deleteEntry } = useTimeline();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    photo: '',
  });

  const resetForm = () => {
    setFormData({ date: '', title: '', description: '', photo: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.title) return;

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
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-xl text-primary-600">Naša priča</h2>
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
            <label className="block text-sm text-gray-600 mb-1">Datum</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-primary-200 focus:border-primary-400 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Naslov</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Prvi dejt, Prvi poljubac..."
              className="w-full px-3 py-2 rounded-lg border border-primary-200 focus:border-primary-400 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Opis</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Ispričaj priču..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-primary-200 focus:border-primary-400 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Slika</label>
            <label className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed border-primary-300 cursor-pointer hover:bg-primary-50 transition-colors">
              <Image className="w-5 h-5 text-primary-400" />
              <span className="text-sm text-primary-500">
                {formData.photo ? 'Promijeni sliku' : 'Dodaj sliku'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
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
          <p className="text-primary-300 mt-3">Učitavanje uspomena...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-primary-300">
          <Calendar className="w-12 h-12 mx-auto mb-3" />
          <p>Još nema uspomena</p>
          <p className="text-sm">Dodaj prvu uspomenu</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 to-secondary-300" />

          <div className="space-y-6">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-10"
              >
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary-400 border-2 border-white shadow" />

                <div className="bg-white rounded-xl p-4 shadow-md shadow-primary-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-primary-400">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <h3 className="font-serif text-lg text-primary-600">{entry.title}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1.5 text-gray-400 hover:text-primary-500 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {entry.photo && (
                    <img
                      src={entry.photo}
                      alt={entry.title}
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                  )}
                  {entry.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{entry.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
