import { useState } from 'react';
import api from '../api/axios';
import { FiX } from 'react-icons/fi';

const EditProfileModal = ({ profile, onClose, onProfileUpdated }) => {
  const [form, setForm] = useState({
    fullName: profile.fullName || '',
    bio: profile.bio || '',
    avatarUrl: profile.avatarUrl || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.put('/users/me', form);
      onProfileUpdated?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-ig-dark border border-ig-border rounded-2xl w-full max-w-md mx-4 overflow-hidden fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ig-border">
          <button onClick={onClose} className="text-ig-text-secondary hover:text-ig-text transition-smooth">
            <FiX className="text-xl" />
          </button>
          <h2 className="font-semibold">Edit Profile</h2>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-ig-primary font-semibold text-sm hover:text-ig-primary-dark transition-smooth disabled:opacity-40"
          >
            {loading ? 'Saving...' : 'Done'}
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-ig-card border border-ig-border flex items-center justify-center overflow-hidden">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-ig-text-secondary">{profile.username[0].toUpperCase()}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-ig-text-secondary mb-1.5">Avatar URL</label>
            <input
              name="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={form.avatarUrl}
              onChange={handleChange}
              className="w-full bg-ig-darker border border-ig-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary/50"
            />
          </div>

          <div>
            <label className="block text-sm text-ig-text-secondary mb-1.5">Full Name</label>
            <input
              name="fullName"
              type="text"
              placeholder="Your full name"
              value={form.fullName}
              onChange={handleChange}
              className="w-full bg-ig-darker border border-ig-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary/50"
            />
          </div>

          <div>
            <label className="block text-sm text-ig-text-secondary mb-1.5">Bio</label>
            <textarea
              name="bio"
              placeholder="Tell people about yourself..."
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full bg-ig-darker border border-ig-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary/50 resize-none"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
