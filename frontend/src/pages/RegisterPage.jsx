import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.fullName);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gradient min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gradient mb-2">Instagram</h1>
          <p className="text-ig-text-secondary text-sm">Sign up to see photos and videos from your friends</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-ig-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-ig-darker/60 border border-ig-border rounded-xl px-4 py-3 text-ig-text placeholder-ig-text-secondary/50 focus:outline-none focus:border-ig-primary transition-smooth"
              required
            />

            <input
              id="register-fullname"
              name="fullName"
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              className="w-full bg-ig-darker/60 border border-ig-border rounded-xl px-4 py-3 text-ig-text placeholder-ig-text-secondary/50 focus:outline-none focus:border-ig-primary transition-smooth"
            />

            <input
              id="register-username"
              name="username"
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full bg-ig-darker/60 border border-ig-border rounded-xl px-4 py-3 text-ig-text placeholder-ig-text-secondary/50 focus:outline-none focus:border-ig-primary transition-smooth"
              required
            />

            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-ig-darker/60 border border-ig-border rounded-xl px-4 py-3 text-ig-text placeholder-ig-text-secondary/50 focus:outline-none focus:border-ig-primary transition-smooth"
              required
              minLength={6}
            />

            <button
              id="register-button"
              type="submit"
              disabled={loading || !form.username || !form.email || !form.password}
              className="w-full bg-gradient-to-r from-ig-primary to-ig-purple text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
                  Creating account...
                </span>
              ) : 'Sign Up'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-ig-border"></div>
            <span className="px-4 text-ig-text-secondary text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-ig-border"></div>
          </div>

          <p className="text-center text-ig-text-secondary text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-ig-primary hover:text-ig-primary-dark font-semibold transition-smooth">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
