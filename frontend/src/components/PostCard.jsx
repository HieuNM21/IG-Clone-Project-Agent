import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiHeart, FiMessageCircle, FiBookmark, FiMoreHorizontal } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const PostCard = ({ post, onLikeToggle }) => {
  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const handleLike = async () => {
    try {
      await api.post(`/posts/${post.id}/like`);
      const newLiked = !liked;
      setLiked(newLiked);
      if (newLiked) {
        setLikeAnimation(true);
        setTimeout(() => setLikeAnimation(false), 600);
      }
      onLikeToggle?.(post.id, newLiked);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDoubleTap = async () => {
    if (!liked) {
      await handleLike();
    } else {
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 600);
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data);
      setShowComments(true);
    } catch (err) {
      console.error(err);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: newComment });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      setCommentCount((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w`;
  };

  return (
    <div className="bg-ig-dark border border-ig-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/profile/${post.username}`} className="flex items-center gap-3 hover:opacity-80 transition-smooth">
          <div className="story-ring">
            <div className="story-ring-inner">
              <div className="w-8 h-8 rounded-full bg-ig-card flex items-center justify-center overflow-hidden">
                {post.userAvatarUrl ? (
                  <img src={post.userAvatarUrl} alt={post.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold">{post.username[0].toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
          <span className="font-semibold text-sm">{post.username}</span>
        </Link>
        <button className="text-ig-text-secondary hover:text-ig-text transition-smooth">
          <FiMoreHorizontal />
        </button>
      </div>

      {/* Image */}
      <div className="relative cursor-pointer" onDoubleClick={handleDoubleTap}>
        <img
          src={post.imageUrl}
          alt={post.caption || 'Post'}
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
        {likeAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <FaHeart className="text-white text-7xl heart-beat drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-smooth hover:opacity-70">
              {liked ? (
                <FaHeart className={`text-2xl text-ig-primary ${likeAnimation ? 'heart-beat' : ''}`} />
              ) : (
                <FiHeart className="text-2xl" />
              )}
            </button>
            <button onClick={loadComments} className="hover:opacity-70 transition-smooth">
              <FiMessageCircle className="text-2xl" />
            </button>
          </div>
          <button className="hover:opacity-70 transition-smooth">
            <FiBookmark className="text-2xl" />
          </button>
        </div>

        {/* Like count */}
        <p className="font-semibold text-sm mb-1">
          {post.likeCount + (liked !== post.likedByCurrentUser ? (liked ? 1 : -1) : 0)} likes
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-1">
            <Link to={`/profile/${post.username}`} className="font-semibold hover:underline">{post.username}</Link>{' '}
            <span className="text-ig-text/90">{post.caption}</span>
          </p>
        )}

        {/* Comment count */}
        {commentCount > 0 && !showComments && (
          <button onClick={loadComments} className="text-ig-text-secondary text-sm hover:text-ig-text transition-smooth">
            View all {commentCount} comments
          </button>
        )}

        {/* Comments */}
        {showComments && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {comments.map((c) => (
              <p key={c.id} className="text-sm">
                <Link to={`/profile/${c.username}`} className="font-semibold hover:underline">{c.username}</Link>{' '}
                <span className="text-ig-text/90">{c.content}</span>
              </p>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-ig-text-secondary text-xs mt-2 uppercase">{timeAgo(post.createdAt)}</p>
      </div>

      {/* Add Comment */}
      <div className="border-t border-ig-border flex items-center px-4 py-2.5">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitComment()}
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder-ig-text-secondary"
        />
        {newComment.trim() && (
          <button onClick={submitComment} className="text-ig-primary font-semibold text-sm hover:text-ig-primary-dark transition-smooth">
            Post
          </button>
        )}
      </div>
    </div>
  );
};

export default PostCard;
