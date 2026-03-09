import { useState } from 'react';
import api from '../api/axios';
import { FiX, FiImage } from 'react-icons/fi';

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/posts', { imageUrl, caption });
      onPostCreated?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-ig-dark border border-ig-border rounded-2xl w-full max-w-lg mx-4 overflow-hidden fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ig-border">
          <button onClick={onClose} className="text-ig-text-secondary hover:text-ig-text transition-smooth">
            <FiX className="text-xl" />
          </button>
          <h2 className="font-semibold">Create New Post</h2>
          <button
            onClick={handleSubmit}
            disabled={loading || !imageUrl.trim()}
            className="text-ig-primary font-semibold text-sm hover:text-ig-primary-dark transition-smooth disabled:opacity-40"
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image URL */}
          <div>
            <label className="block text-sm text-ig-text-secondary mb-1.5">Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setPreview(false); }}
                className="flex-1 bg-ig-darker border border-ig-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary/50"
                required
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="px-3 py-2 bg-ig-card border border-ig-border rounded-xl text-xs hover:bg-ig-border transition-smooth"
                >
                  {preview ? 'Hide' : 'Preview'}
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && imageUrl && (
            <div className="rounded-xl overflow-hidden border border-ig-border">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full max-h-80 object-contain bg-black"
                onError={() => setError('Cannot load image from this URL')}
              />
            </div>
          )}

          {/* No image placeholder */}
          {!preview && (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-ig-border rounded-xl text-ig-text-secondary">
              <FiImage className="text-4xl mb-2" />
              <p className="text-sm">Paste an image URL above</p>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm text-ig-text-secondary mb-1.5">Caption</label>
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full bg-ig-darker border border-ig-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary/50 resize-none"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
