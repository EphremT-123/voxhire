import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const PostJob = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [budget, setBudget] = useState('');
    const [description, setDescription] = useState('');
    const [urgency, setUrgency] = useState('normal');
    const [deadline, setDeadline] = useState('7 days');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
        try {
            await api.post('/jobs', { title, budget: Number(budget), description, urgency, deadline });
            setSuccess('Job posted!');
            setTimeout(() => navigate('/jobs'), 1500);
        } catch (err) { setError(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Post a New Job</h1>
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4">{error}</div>}
                    {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4">{success}</div>}
                    <div className="mb-4">
                        <label className="block font-medium text-gray-900 mb-2">Job Title *</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800" required />
                    </div>
                    <div className="mb-4">
                        <label className="block font-medium text-gray-900 mb-2">Budget ($) *</label>
                        <input type="number" value={budget} onChange={e => setBudget(e.target.value)} min="50" className="w-full p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800" required />
                    </div>
                    <div className="mb-4">
                        <label className="block font-medium text-gray-900 mb-2">Description *</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block font-medium text-gray-900 mb-2">Urgency</label>
                            <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none bg-white text-gray-800">
                                <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="super_urgent">Super Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-medium text-gray-900 mb-2">Deadline</label>
                            <select value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none bg-white text-gray-800">
                                <option value="24 hours">24 hours</option><option value="3 days">3 days</option><option value="7 days">7 days</option><option value="14 days">14 days</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white p-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50">
                        {loading ? 'Posting...' : '📤 Post Job'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PostJob;