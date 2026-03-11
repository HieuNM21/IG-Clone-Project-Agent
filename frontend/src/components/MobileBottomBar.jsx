import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import { IoAddCircleOutline, IoPaperPlane, IoPaperPlaneOutline } from 'react-icons/io5';
import { AiOutlineSearch } from 'react-icons/ai';

const MobileBottomBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="mobile-bottom-bar md:hidden">
      <Link to="/" className="flex flex-col items-center text-2xl" id="m-nav-home">
        {isActive('/') ? <AiFillHome /> : <AiOutlineHome />}
      </Link>

      <button className="text-2xl" id="m-nav-search">
        <AiOutlineSearch />
      </button>

      <button className="text-2xl" onClick={() => navigate('/create')} id="m-nav-create">
        <IoAddCircleOutline />
      </button>

      <Link to="/direct" className="text-2xl" id="m-nav-messages">
        {isActive('/direct') ? <IoPaperPlane /> : <IoPaperPlaneOutline />}
      </Link>

      <Link to={`/profile/${user?.username}`} className="flex items-center justify-center" id="m-nav-profile">
        <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${
          location.pathname.includes(`/profile/${user?.username}`) ? 'border-white' : 'border-transparent'
        }`}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-ig-card flex items-center justify-center">
              <span className="text-[10px]">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default MobileBottomBar;
