import { useState, useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const Feed = () => {
    const user = useAuthStore((s) => s.user);
    const [posts, setPosts] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const { data } = await api.get('/posts');
            setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
            await api.post('/posts', { text });
            setText('');
            fetchPosts();
        } catch (err) {
            alert('Failed to post');
        }
    };

    const handleLike = async (postId) => {
        try {
            await api.post(`/posts/${postId}/like`);
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-blue-900">
            <Navbar />
            <div className="max-w-2xl mx-auto p-6">
                <h1 className="text-3xl font-bold text-white mb-6">Feed</h1>

                <form onSubmit={handlePost} className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl mb-6">
                    <textarea value={text} onChange={(e) => setText(e.target.value)}
                        placeholder="Share your experience..." className="w-full border-2 border-amber-200 rounded-xl p-3 mb-2" rows={3} />
                    <button type="submit" className="bg-gradient-to-r from-amber-700 to-blue-700 text-white px-6 py-2 rounded-xl font-semibold">
                        Post
                    </button>
                </form>

                {loading ? (
                    <p className="text-white">Loading...</p>
                ) : (
                    posts.map(post => (
                        <div key={post._id} className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-xl mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                    {post.user?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-900">{post.user?.name}</p>
                                    <p className="text-sm text-gray-500">@{post.user?.username}</p>
                                </div>
                            </div>
                            <p className="text-gray-800 mb-3">{post.text}</p>
                            <div className="flex gap-4 text-sm">
                                <button onClick={() => handleLike(post._id)} className="text-red-500">
                                    ❤️ {post.likes?.length || 0}
                                </button>
                                <span className="text-gray-500">💬 {post.comments?.length || 0}</span>
                                <span className="text-gray-500">🔄 {post.shares?.length || 0}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Feed;