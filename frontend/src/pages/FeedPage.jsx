import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StoryTray from '../components/StoryTray';
import PostCard from '../components/PostCard';

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef();

  const fetchFeed = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get(`/feed?page=${pageNum}&size=10`);
      const newPosts = res.data.content;
      setPosts((prev) => pageNum === 0 ? newPosts : [...prev, ...newPosts]);
      setHasMore(!res.data.last);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [loading]);

  const fetchStories = useCallback(async () => {
    try {
      const res = await api.get('/stories');
      setStories(res.data);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  }, []);

  useEffect(() => {
    fetchFeed(0);
    fetchStories();
  }, []);

  // Infinite scroll observer
  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchFeed(nextPage);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, page]
  );

  const handleLikeToggle = (postId, liked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedByCurrentUser: liked, likeCount: liked ? p.likeCount + 1 : p.likeCount - 1 }
          : p
      )
    );
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-ig-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      {/* Story Tray */}
      <StoryTray stories={stories} currentUser={user} />

      {/* Posts */}
      <div className="space-y-6 mt-6">
        {posts.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-xl font-semibold mb-2">No Posts Yet</h2>
            <p className="text-ig-text-secondary">Follow people to see their posts in your feed</p>
          </div>
        )}

        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <div
              key={post.id}
              ref={isLast ? lastPostRef : null}
              className="fade-in"
              style={{ animationDelay: `${(index % 5) * 0.05}s` }}
            >
              <PostCard post={post} onLikeToggle={handleLikeToggle} />
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-ig-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
