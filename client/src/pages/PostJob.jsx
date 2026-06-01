import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const PostJob = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        budget: '',
        description: '',
        urgency: 'normal',
        deadline: '7 days',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [connectCost, setConnectCost] = useState(0);
    const [loading, setLoading] = useState(false);

    const calculateCost = (budget, urgency) => {
        let base = Math.max(50, Math.min(500, Math.floor(budget / 5)));
        if (urgency === 'urgent') base = Math.min(500, Math.floor(base * 1.5));
        if (urgency === 'super_urgent') base = Math.min(500, Math.floor(base * 2));
        return base;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newForm = { ...form, [name]: value };
        setForm(newForm);

        if (name === 'budget' || name === 'urgency') {
            const cost = calculateCost(
                parseInt(newForm.budget) || 0,
                newForm.urgency
            );
            setConnectCost(cost);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!form.title || !form.budget || !form.description) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        try {
            await api.post('/jobs', {
                title: form.title,
                budget: parseInt(form.budget),
                description: form.description,
                urgency: form.urgency,
                deadline: form.deadline,
            });
            setSuccess('Job posted successfully!');
            setTimeout(() => navigate('/jobs'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-blue-900">
            <Navbar />
            <div className="max-w-2xl mx-auto p-6">
                <h1 className="text-3xl font-bold text-white mb-6">Post a New Job</h1>

                <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-xl mb-4">
                            {success}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-amber-900 font-semibold mb-2">Job Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g., Corporate Explainer Video"
                            className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-amber-900 font-semibold mb-2">Budget ($) *</label>
                        <input
                            type="number"
                            name="budget"
                            value={form.budget}
                            onChange={handleChange}
                            placeholder="500"
                            min="50"
                            max="10000"
                            className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-amber-900 font-semibold mb-2">Description *</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe your project requirements..."
                            rows="4"
                            className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-amber-900 font-semibold mb-2">Urgency</label>
                            <select
                                name="urgency"
                                value={form.urgency}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none bg-white"
                            >
                                <option value="normal">Normal (7 days, 1x)</option>
                                <option value="urgent">Urgent (3 days, 1.5x)</option>
                                <option value="super_urgent">Super Urgent (24 hours, 2x)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-amber-900 font-semibold mb-2">Deadline</label>
                            <select
                                name="deadline"
                                value={form.deadline}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none bg-white"
                            >
                                <option value="24 hours">24 hours</option>
                                <option value="3 days">3 days</option>
                                <option value="5 days">5 days</option>
                                <option value="7 days">7 days</option>
                                <option value="14 days">14 days</option>
                                <option value="30 days">30 days</option>
                            </select>
                        </div>
                    </div>

                    {form.budget > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-blue-50 p-4 rounded-xl mb-6">
                            <p className="text-amber-900 font-semibold">
                                📊 Connect Cost: <span className="text-blue-700">{connectCost} connects</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                (${((connectCost * 0.01).toFixed(2))} USD)
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-700 to-blue-700 text-white p-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                    >
                        {loading ? 'Posting...' : '📤 Post Job'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PostJob;