import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
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
          <p className="text-ig-text-secondary text-sm">Share your moments with the world</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-ig-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <input
                id="login-username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-ig-darker/60 border border-ig-border rounded-xl px-4 py-3 text-ig-text placeholder-ig-text-secondary/50 focus:outline-none focus:border-ig-primary transition-smooth"
                required
              />
            </div>

            <div>
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ig-darker/60 border border-ig-border rounded-xl px-4 py-3 text-ig-text placeholder-ig-text-secondary/50 focus:outline-none focus:border-ig-primary transition-smooth"
                required
              />
            </div>

            <button
              id="login-button"
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-gradient-to-r from-ig-primary to-ig-purple text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
                  Logging in...
                </span>
              ) : 'Log In'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-ig-border"></div>
            <span className="px-4 text-ig-text-secondary text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-ig-border"></div>
          </div>

          <p className="text-center text-ig-text-secondary text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-ig-primary hover:text-ig-primary-dark font-semibold transition-smooth">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
