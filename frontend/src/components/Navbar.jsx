import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import api from '../api/axios';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import { IoPaperPlaneOutline, IoPaperPlane } from 'react-icons/io5';
import { FiHeart, FiLogOut, FiSearch } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount, notifications, clearNotifications } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = async () => {
    setShowNotif(!showNotif);
    if (!showNotif && unreadCount > 0) {
      try {
        await api.post('/notifications/mark-read');
        clearNotifications();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-ig-border h-16">
      <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="text-gradient text-2xl font-bold tracking-tight hover:opacity-80 transition-smooth">
          Instagram
        </Link>

        {/* Search */}
        <div className="hidden md:block relative" ref={searchRef}>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-secondary" />
            <input
              id="nav-search"
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="bg-ig-card border border-ig-border rounded-lg pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-ig-text-secondary transition-smooth placeholder-ig-text-secondary"
            />
          </div>

          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-80 bg-ig-card border border-ig-border rounded-xl shadow-2xl overflow-hidden">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    navigate(`/profile/${u.username}`);
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ig-border transition-smooth"
                >
                  <div className="w-10 h-10 rounded-full bg-ig-dark flex items-center justify-center overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{u.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{u.username}</p>
                    {u.fullName && <p className="text-xs text-ig-text-secondary">{u.fullName}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav Icons */}
        <div className="flex items-center gap-5">
          <Link to="/" className="text-2xl hover:opacity-70 transition-smooth" id="nav-home">
            {isActive('/') ? <AiFillHome /> : <AiOutlineHome />}
          </Link>

          <Link to="/direct" className="text-2xl hover:opacity-70 transition-smooth" id="nav-direct">
            {isActive('/direct') ? <IoPaperPlane /> : <IoPaperPlaneOutline />}
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={handleNotifClick} className="text-2xl hover:opacity-70 transition-smooth relative" id="nav-notifications">
              {showNotif ? <FaHeart className="text-ig-primary" /> : <FiHeart />}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-ig-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center badge-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-ig-card border border-ig-border rounded-xl shadow-2xl">
                <div className="p-3 border-b border-ig-border">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-ig-text-secondary text-sm">No notifications yet</div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={n.id || i} className="flex items-center gap-3 px-4 py-3 hover:bg-ig-border transition-smooth">
                      <div className="w-8 h-8 rounded-full bg-ig-dark flex items-center justify-center overflow-hidden flex-shrink-0">
                        {n.actorAvatarUrl ? (
                          <img src={n.actorAvatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs">{n.actorUsername?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <p className="text-sm">
                        <span className="font-semibold">{n.actorUsername}</span>{' '}
                        {n.type === 'LIKE' && 'liked your post'}
                        {n.type === 'COMMENT' && 'commented on your post'}
                        {n.type === 'FOLLOW' && 'started following you'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <Link
            to={`/profile/${user?.username}`}
            className="w-7 h-7 rounded-full bg-ig-card border border-ig-border flex items-center justify-center overflow-hidden hover:border-ig-text transition-smooth"
            id="nav-profile"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs">{user?.username?.[0]?.toUpperCase()}</span>
            )}
          </Link>

          {/* Logout */}
          <button onClick={logout} className="text-xl text-ig-text-secondary hover:text-ig-text transition-smooth" id="nav-logout">
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
