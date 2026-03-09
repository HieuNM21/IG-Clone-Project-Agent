import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';

const PostPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data);
      } catch (err) {
        console.error('Failed to fetch post:', err);
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-ig-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20 fade-in">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-semibold mb-2">{error || 'Post not found'}</h2>
        <Link to="/" className="text-ig-primary hover:text-ig-primary-dark font-semibold transition-smooth">
          Go back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 fade-in">
      <PostCard post={post} />
    </div>
  );
};

export default PostPage;
