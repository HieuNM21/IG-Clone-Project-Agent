import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import CreatePostModal from './CreatePostModal';
import NotificationDrawer from './NotificationDrawer';

import {
  AiOutlineHome, AiFillHome,
  AiOutlineSearch, AiOutlineCompass, AiFillCompass,
  AiOutlineHeart, AiFillHeart,
  AiOutlineMenu,
} from 'react-icons/ai';
import {
  IoPaperPlaneOutline, IoPaperPlane,
  IoAddCircleOutline,
} from 'react-icons/io5';
import { FiBookmark, FiLogOut, FiSettings } from 'react-icons/fi';
import { RiInstagramLine } from 'react-icons/ri';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const moreRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const isMessagesActive = location.pathname === '/direct';

  // Close more menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = () => {
    setDrawerOpen((prev) => !prev);
  };

  const navItems = [
    {
      label: 'Home',
      icon: isActive('/') ? <AiFillHome /> : <AiOutlineHome />,
      onClick: () => { setDrawerOpen(false); navigate('/'); },
      active: isActive('/'),
    },
    {
      label: 'Search',
      icon: <AiOutlineSearch />,
      onClick: () => { setDrawerOpen(false); },
      active: false,
    },
    {
      label: 'Explore',
      icon: <AiOutlineCompass />,
      onClick: () => { setDrawerOpen(false); },
      active: false,
    },
    {
      label: 'Messages',
      icon: isMessagesActive ? <IoPaperPlane /> : <IoPaperPlaneOutline />,
      onClick: () => { setDrawerOpen(false); navigate('/direct'); },
      active: isMessagesActive,
    },
    {
      label: 'Notifications',
      icon: drawerOpen ? <AiFillHeart className="text-ig-primary" /> : <AiOutlineHeart />,
      onClick: handleNotifClick,
      active: drawerOpen,
      badge: unreadCount,
    },
    {
      label: 'Create',
      icon: <IoAddCircleOutline />,
      onClick: () => { setDrawerOpen(false); setShowCreatePost(true); },
      active: false,
    },
    {
      label: 'Profile',
      icon: (
        <div className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center overflow-hidden ${
          location.pathname.includes(`/profile/${user?.username}`) ? 'border-white' : 'border-transparent'
        }`}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px]">{user?.username?.[0]?.toUpperCase()}</span>
          )}
        </div>
      ),
      onClick: () => { setDrawerOpen(false); navigate(`/profile/${user?.username}`); },
      active: location.pathname.includes(`/profile/${user?.username}`),
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar hidden md:flex ${drawerOpen ? 'sidebar-narrow' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link to="/" onClick={() => setDrawerOpen(false)}>
            <RiInstagramLine className="text-[28px] flex-shrink-0" />
          </Link>
          <span className="sidebar-logo-text text-gradient">Instagram</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`sidebar-nav-item w-full ${item.active ? 'active font-bold' : 'font-normal'}`}
            >
              <span className="sidebar-icon relative">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-ig-primary text-white text-[9px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center badge-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* More */}
        <div className="relative px-2 pb-4 mt-auto" ref={moreRef}>
          <button
            onClick={() => setShowMore(!showMore)}
            className="sidebar-nav-item w-full"
          >
            <span className="sidebar-icon"><AiOutlineMenu /></span>
            <span className="sidebar-label">More</span>
          </button>

          {showMore && (
            <div className="absolute bottom-full left-0 ml-2 mb-2 w-56 bg-ig-card border border-ig-border rounded-xl shadow-2xl py-2 z-50">
              <button className="w-full text-left px-4 py-3 hover:bg-white/5 transition flex items-center gap-3 text-sm" onClick={() => { navigate(`/profile/${user?.username}`); setShowMore(false); }}>
                <FiSettings className="text-lg" /> Settings
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-white/5 transition flex items-center gap-3 text-sm" onClick={() => { navigate(`/profile/${user?.username}`); setShowMore(false); }}>
                <FiBookmark className="text-lg" /> Saved
              </button>
              <div className="border-t border-ig-border my-1" />
              <button className="w-full text-left px-4 py-3 hover:bg-white/5 transition flex items-center gap-3 text-sm" onClick={() => { logout(); setShowMore(false); }}>
                <FiLogOut className="text-lg" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Overlay to close drawer */}
      {drawerOpen && (
        <div className="drawer-overlay hidden md:block" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onPostCreated={() => { setShowCreatePost(false); navigate('/'); window.location.reload(); }}
        />
      )}
    </>
  );
};

export default Sidebar;
