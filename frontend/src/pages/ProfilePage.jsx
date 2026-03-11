import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMiniChat } from '../context/MiniChatContext';
import EditProfileModal from '../components/EditProfileModal';
import { HiOutlineViewGrid } from 'react-icons/hi';
import { FiBookmark } from 'react-icons/fi';
import { IoPaperPlaneOutline } from 'react-icons/io5';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { openChat } = useMiniChat();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setActiveTab('posts');
      try {
        const profileRes = await api.get(`/users/${username}`);
        setProfile(profileRes.data);

        const postsRes = await api.get(`/posts/user/${profileRes.data.id}`);
        setPosts(postsRes.data);

        // Fetch saved posts only for own profile
        if (currentUser?.username === username) {
          const savedRes = await api.get('/posts/bookmarks');
          setSavedPosts(savedRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser?.username]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      await api.post(`/users/${profile.id}/follow`);
      setProfile((prev) => ({
        ...prev,
        followedByCurrentUser: !prev.followedByCurrentUser,
        followerCount: prev.followedByCurrentUser ? prev.followerCount - 1 : prev.followerCount + 1,
      }));
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleMessageUser = () => {
    openChat({ type: 'user', data: profile });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-ig-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">User not found</h2>
      </div>
    );
  }

  const displayPosts = activeTab === 'posts' ? posts : savedPosts;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
        <div className="story-ring flex-shrink-0">
          <div className="story-ring-inner">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-ig-card flex items-center justify-center overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl text-ig-text-secondary">{profile.username[0].toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="text-xl font-light">{profile.username}</h1>
            {isOwnProfile ? (
              <button onClick={() => setShowEditProfile(true)}
                className="px-6 py-1.5 bg-ig-card border border-ig-border rounded-lg text-sm font-semibold hover:bg-ig-border transition-smooth">
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleFollow}
                  className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-smooth ${
                    profile.followedByCurrentUser
                      ? 'bg-ig-card border border-ig-border hover:bg-ig-border'
                      : 'bg-gradient-to-r from-ig-primary to-ig-purple text-white hover:opacity-90'
                  }`}>
                  {profile.followedByCurrentUser ? 'Following' : 'Follow'}
                </button>
                <button onClick={handleMessageUser}
                  className="px-4 py-1.5 bg-ig-card border border-ig-border rounded-lg text-sm font-semibold hover:bg-ig-border transition-smooth flex items-center gap-1.5">
                  <IoPaperPlaneOutline /> Message
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-center md:justify-start gap-8 mb-4">
            <div className="text-center md:text-left">
              <span className="font-semibold">{profile.postCount}</span>
              <span className="text-ig-text-secondary ml-1">posts</span>
            </div>
            <div className="text-center md:text-left cursor-pointer hover:text-ig-text transition-smooth">
              <span className="font-semibold">{profile.followerCount}</span>
              <span className="text-ig-text-secondary ml-1">followers</span>
            </div>
            <div className="text-center md:text-left cursor-pointer hover:text-ig-text transition-smooth">
              <span className="font-semibold">{profile.followingCount}</span>
              <span className="text-ig-text-secondary ml-1">following</span>
            </div>
          </div>

          <div>
            {profile.fullName && <p className="font-semibold text-sm">{profile.fullName}</p>}
            {profile.bio && <p className="text-sm mt-1 text-ig-text-secondary">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-ig-border">
        <div className="flex justify-center gap-12">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 py-3 px-4 text-xs uppercase tracking-widest transition-smooth ${
              activeTab === 'posts' ? 'border-t border-ig-text -mt-px text-ig-text' : 'text-ig-text-secondary hover:text-ig-text'
            }`}>
            <HiOutlineViewGrid className="text-lg" /> Posts
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-3 px-4 text-xs uppercase tracking-widest transition-smooth ${
                activeTab === 'saved' ? 'border-t border-ig-text -mt-px text-ig-text' : 'text-ig-text-secondary hover:text-ig-text'
              }`}>
              <FiBookmark className="text-lg" /> Saved
            </button>
          )}
        </div>
      </div>

      {/* Post Grid */}
      {displayPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">{activeTab === 'posts' ? '📷' : '🔖'}</div>
          <h3 className="text-xl font-light">
            {activeTab === 'posts' ? 'No Posts Yet' : 'No Saved Posts'}
          </h3>
          {activeTab === 'saved' && (
            <p className="text-ig-text-secondary text-sm mt-2">Save posts to see them here</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 mt-1">
          {displayPosts.map((post) => (
            <Link
              to={`/post/${post.id}`}
              key={post.id}
              className="aspect-square bg-ig-card overflow-hidden cursor-pointer group relative"
            >
              <img src={post.imageUrl} alt={post.caption || 'Post'}
                className="w-full h-full object-cover transition-smooth group-hover:opacity-75" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth bg-black/30">
                <div className="flex gap-6 text-white font-semibold">
                  <span>❤️ {post.likeCount}</span>
                  <span>💬 {post.commentCount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showEditProfile && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onProfileUpdated={(updatedProfile) => {
            setProfile(updatedProfile);
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
