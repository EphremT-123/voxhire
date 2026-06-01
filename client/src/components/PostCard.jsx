import { useState } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const PostCard = ({ post, onUpdate }) => {
    const user = useAuthStore((s) => s.user);
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);

    const isLiked = post.likes?.some(l => l._id === user._id);

    const handleLike = async () => {
        try {
            await api.post(`/posts/${post._id}/like`);
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            await api.post(`/posts/${post._id}/comment`, { text: commentText });
            setCommentText('');
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async () => {
        try {
            await api.post(`/posts/${post._id}/share`);
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded shadow p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
                <img src={post.user?.profilePicture || '/default-avatar.png'}
                    className="w-10 h-10 rounded-full object-cover bg-gray-300" alt="" />
                <div>
                    <p className="font-semibold">{post.user?.name}</p>
                    <p className="text-sm text-gray-500">@{post.user?.username}</p>
                </div>
            </div>

            <p className="mb-3">{post.text}</p>

            {post.image && (
                <img src={post.image} className="w-full rounded mb-3 max-h-96 object-cover" alt="" />
            )}

            <div className="flex gap-4 text-sm text-gray-600">
                <button onClick={handleLike} className={isLiked ? 'text-red-500' : ''}>
                    ❤️ {post.likes?.length || 0}
                </button>
                <button onClick={() => setShowComments(!showComments)}>
                    💬 {post.comments?.length || 0}
                </button>
                <button onClick={handleShare}>
                    🔄 {post.shares?.length || 0}
                </button>
                <span className="text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            {showComments && (
                <div className="mt-3 border-t pt-3">
                    {post.comments?.map((comment, idx) => (
                        <div key={idx} className="mb-2 flex items-start gap-2">
                            <img src={comment.user?.profilePicture || '/default-avatar.png'}
                                className="w-6 h-6 rounded-full bg-gray-300" alt="" />
                            <div>
                                <span className="font-semibold text-sm">{comment.user?.name}</span>
                                <p className="text-sm">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                    <form onSubmit={handleComment} className="flex gap-2 mt-2">
                        <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..." className="flex-1 border rounded p-1 text-sm" />
                        <button type="submit" className="text-sm text-indigo-600">Post</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PostCard;