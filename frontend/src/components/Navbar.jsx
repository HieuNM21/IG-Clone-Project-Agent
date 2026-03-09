import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import api from '../api/axios';
import CreatePostModal from './CreatePostModal';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import { IoPaperPlaneOutline, IoPaperPlane } from 'react-icons/io5';
import { FiHeart, FiLogOut, FiSearch, FiPlusSquare, FiCheck } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

const notifText = (type) => {
  switch (type) {
    case 'LIKE': return 'liked your post';
    case 'COMMENT': return 'commented on your post';
    case 'FOLLOW': return 'started following you';
    default: return 'interacted with you';
  }
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount, notifications, markNotificationsRead, markOneNotificationRead } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

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
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
  };

  const handleNotifClick = () => {
    setShowNotif(!showNotif);
  };

  const handleMarkAllRead = () => {
    markNotificationsRead();
  };

  const handleNotifItemClick = (n) => {
    // Mark this notification as read
    if (!n.isRead) {
      markOneNotificationRead(n.id);
    }
    setShowNotif(false);

    if (n.type === 'FOLLOW') {
      navigate(`/profile/${n.actorUsername}`);
    } else if (n.targetId) {
      navigate(`/post/${n.targetId}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-ig-border h-16">
      <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4">
        <Link to="/" className="text-gradient text-2xl font-bold tracking-tight hover:opacity-80 transition-smooth">
          Instagram
        </Link>

        {/* Search */}
        <div className="hidden md:block relative" ref={searchRef}>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-secondary" />
            <input id="nav-search" type="text" placeholder="Search" value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)} onFocus={() => setShowSearch(true)}
              className="bg-ig-card border border-ig-border rounded-lg pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-ig-text-secondary transition-smooth placeholder-ig-text-secondary" />
          </div>
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-80 bg-ig-card border border-ig-border rounded-xl shadow-2xl overflow-hidden">
              {searchResults.map((u) => (
                <button key={u.id} onClick={() => { navigate(`/profile/${u.username}`); setShowSearch(false); setSearchQuery(''); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ig-border transition-smooth">
                  <div className="w-10 h-10 rounded-full bg-ig-dark flex items-center justify-center overflow-hidden">
                    {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">{u.username[0].toUpperCase()}</span>}
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

          <button onClick={() => setShowCreatePost(true)} className="text-2xl hover:opacity-70 transition-smooth" id="nav-create-post">
            <FiPlusSquare />
          </button>

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
              <div className="absolute right-0 top-full mt-2 w-96 max-h-[28rem] overflow-y-auto bg-ig-card border border-ig-border rounded-xl shadow-2xl">
                <div className="p-3 border-b border-ig-border flex items-center justify-between sticky top-0 bg-ig-card z-10 rounded-t-xl">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {notifications.some((n) => !n.isRead) && (
                    <button onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-xs text-ig-primary hover:text-ig-primary-dark transition-smooth font-semibold">
                      <FiCheck className="text-sm" />
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-ig-text-secondary text-sm">
                    <FiHeart className="text-3xl mx-auto mb-3 opacity-40" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <button key={n.id || i} onClick={() => handleNotifItemClick(n)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-ig-border transition-smooth text-left ${!n.isRead ? 'bg-ig-primary/5' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-ig-dark flex items-center justify-center overflow-hidden flex-shrink-0">
                        {n.actorAvatarUrl ? <img src={n.actorAvatarUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xs">{n.actorUsername?.[0]?.toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{n.actorUsername}</span>{' '}
                          {notifText(n.type)}
                        </p>
                        <p className="text-xs text-ig-text-secondary mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-ig-primary flex-shrink-0"></span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <Link to={`/profile/${user?.username}`} className="w-7 h-7 rounded-full bg-ig-card border border-ig-border flex items-center justify-center overflow-hidden hover:border-ig-text transition-smooth" id="nav-profile">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">{user?.username?.[0]?.toUpperCase()}</span>}
          </Link>

          <button onClick={logout} className="text-xl text-ig-text-secondary hover:text-ig-text transition-smooth" id="nav-logout">
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>

    {showCreatePost && (
      <CreatePostModal
        onClose={() => setShowCreatePost(false)}
        onPostCreated={() => { setShowCreatePost(false); navigate('/'); window.location.reload(); }}
      />
    )}
    </>
  );
};

export default Navbar;
