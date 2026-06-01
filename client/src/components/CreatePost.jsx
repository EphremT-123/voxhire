import { useState } from 'react';
import api from '../services/api';

const CreatePost = ({ onPostCreated }) => {
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [posting, setPosting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setPosting(true);

        try {
            const formData = new FormData();
            formData.append('text', text);
            if (image) formData.append('image', image);

            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setText('');
            setImage(null);
            onPostCreated();
        } catch (err) {
            console.error(err);
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="bg-white rounded shadow p-4 mb-4">
            <form onSubmit={handleSubmit}>
                <textarea value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Share your experience..." className="w-full border rounded p-2 mb-2" rows={3} />
                <div className="flex justify-between items-center">
                    <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])}
                        className="text-sm" />
                    <button type="submit" disabled={posting || !text.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50">
                        {posting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;