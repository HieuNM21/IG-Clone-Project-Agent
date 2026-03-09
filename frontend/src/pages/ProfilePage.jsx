import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { HiOutlineViewGrid } from 'react-icons/hi';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileRes = await api.get(`/users/${username}`);
        setProfile(profileRes.data);

        const postsRes = await api.get(`/posts/user/${profileRes.data.id}`);
        setPosts(postsRes.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

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

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
        {/* Avatar */}
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

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="text-xl font-light">{profile.username}</h1>
            {isOwnProfile ? (
              <button className="px-6 py-1.5 bg-ig-card border border-ig-border rounded-lg text-sm font-semibold hover:bg-ig-border transition-smooth">
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-smooth ${
                  profile.followedByCurrentUser
                    ? 'bg-ig-card border border-ig-border hover:bg-ig-border'
                    : 'bg-gradient-to-r from-ig-primary to-ig-purple text-white hover:opacity-90'
                }`}
              >
                {profile.followedByCurrentUser ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Stats */}
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

          {/* Bio */}
          <div>
            {profile.fullName && <p className="font-semibold text-sm">{profile.fullName}</p>}
            {profile.bio && <p className="text-sm mt-1 text-ig-text-secondary">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Tab */}
      <div className="border-t border-ig-border">
        <div className="flex justify-center">
          <button className="flex items-center gap-2 py-3 px-4 text-xs uppercase tracking-widest border-t border-ig-text -mt-px">
            <HiOutlineViewGrid className="text-lg" /> Posts
          </button>
        </div>
      </div>

      {/* Post Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📷</div>
          <h3 className="text-xl font-light">No Posts Yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 mt-1">
          {posts.map((post) => (
            <div
              key={post.id}
              className="aspect-square bg-ig-card overflow-hidden cursor-pointer group relative"
            >
              <img
                src={post.imageUrl}
                alt={post.caption || 'Post'}
                className="w-full h-full object-cover transition-smooth group-hover:opacity-75"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth bg-black/30">
                <div className="flex gap-6 text-white font-semibold">
                  <span>❤️ {post.likeCount}</span>
                  <span>💬 {post.commentCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
