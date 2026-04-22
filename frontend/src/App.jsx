import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import DirectPage from './pages/DirectPage';
import PostPage from './pages/PostPage';
import Sidebar from './components/Sidebar';
import MobileBottomBar from './components/MobileBottomBar';
import FloatingMiniChat from './components/FloatingMiniChat';
import IncomingCallRing from './components/IncomingCallRing';
import ActiveCallUI from './components/ActiveCallUI';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-ig-darker"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-ig-primary"></div></div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" /> : children;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-ig-darker text-ig-text">
      {isAuthenticated && <Sidebar />}
      {isAuthenticated && <MobileBottomBar />}
      <main className={isAuthenticated ? 'app-main-with-sidebar' : ''}>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
          <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/direct" element={<PrivateRoute><DirectPage /></PrivateRoute>} />
          <Route path="/post/:id" element={<PrivateRoute><PostPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {isAuthenticated && <FloatingMiniChat />}
      {isAuthenticated && <IncomingCallRing />}
      {isAuthenticated && <ActiveCallUI />}
    </div>
  );
}

export default App;
