import { useState } from 'react';
import api from '../api/axios';
import { FiX, FiFilm } from 'react-icons/fi';

const CreateStoryModal = ({ onClose, onStoryCreated }) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mediaUrl.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/stories', { mediaUrl });
      onStoryCreated?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-ig-dark border border-ig-border rounded-2xl w-full max-w-sm mx-4 overflow-hidden fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ig-border">
          <button onClick={onClose} className="text-ig-text-secondary hover:text-ig-text transition-smooth">
            <FiX className="text-xl" />
          </button>
          <h2 className="font-semibold">Add Story</h2>
          <button
            onClick={handleSubmit}
            disabled={loading || !mediaUrl.trim()}
            className="text-ig-primary font-semibold text-sm hover:text-ig-primary-dark transition-smooth disabled:opacity-40"
          >
            {loading ? 'Posting...' : 'Share'}
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-ig-text-secondary mb-1.5">Media URL</label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full bg-ig-darker border border-ig-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary/50"
              required
            />
          </div>

          {mediaUrl ? (
            <div className="rounded-xl overflow-hidden border border-ig-border">
              <img src={mediaUrl} alt="Preview" className="w-full max-h-60 object-contain bg-black" onError={() => setError('Cannot load image')} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed border-ig-border rounded-xl text-ig-text-secondary">
              <FiFilm className="text-3xl mb-2" />
              <p className="text-xs">Story expires after 24 hours</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal;
