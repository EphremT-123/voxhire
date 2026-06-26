import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const MyApplications = () => {
    const user = useAuthStore((s) => s.user);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchApplications(); }, []);

    const fetchApplications = async () => {
        setLoading(true); setError('');
        try { const { data } = await api.get('/jobs/my/applications'); setApplications(data); }
        catch (err) { setError(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    const filteredApps = filter === 'all' ? applications : applications.filter(a => a.status === filter);

    const getStatusBadge = (s) => ({ pending: 'bg-yellow-100 text-yellow-800', shortlisted: 'bg-blue-100 text-blue-800', accepted: 'bg-green-100 text-green-800', declined: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');

    const statusCounts = { all: applications.length, pending: applications.filter(a => a.status === 'pending').length, shortlisted: applications.filter(a => a.status === 'shortlisted').length, accepted: applications.filter(a => a.status === 'accepted').length, declined: applications.filter(a => a.status === 'declined').length };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex justify-between items-center">
                        <div><h1 className="text-2xl font-bold text-gray-900">My Applications</h1><p className="text-gray-500 mt-1">Track your job applications</p></div>
                        <button onClick={() => navigate('/jobs')} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium">🔍 Browse Jobs</button>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4">{error}</div>}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {Object.entries(statusCounts).map(([key, count]) => (
                        <button key={key} onClick={() => setFilter(key)} className={`p-4 rounded-xl text-center transition ${filter === key ? 'bg-white border border-gray-300 shadow-sm' : 'bg-white border border-gray-200'}`}>
                            <div className="text-2xl font-bold text-gray-900">{count}</div><div className="text-xs text-gray-500 capitalize">{key}</div>
                        </button>
                    ))}
                </div>

                {loading && <p className="text-center text-gray-500">Loading...</p>}
                {!loading && filteredApps.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
                        <div className="text-6xl mb-4">📭</div>
                        <p>{applications.length === 0 ? "No applications yet." : `No ${filter} applications.`}</p>
                        <button onClick={() => navigate('/jobs')} className="mt-4 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium">Find Jobs</button>
                    </div>
                )}

                <div className="space-y-4">
                    {filteredApps.map(app => {
                        const job = app.job || {};
                        const status = getStatusBadge(app.status);
                        return (
                            <div key={app._id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div><h3 className="text-xl font-bold text-gray-900">{job.title || 'Unknown Job'}</h3><p className="text-sm text-gray-400">Applied {new Date(app.createdAt).toLocaleDateString()}</p></div>
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${status}`}>
                                        {app.status === 'accepted' ? '✅ Accepted!' : app.status === 'shortlisted' ? '⭐ Shortlisted' : app.status === 'declined' ? '❌ Declined' : '🟡 Pending'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                                    <div className="bg-gray-50 p-3 rounded-xl text-center"><div className="font-bold text-gray-900">${job.budget || 'N/A'}</div><div className="text-xs text-gray-500">Budget</div></div>
                                    <div className="bg-gray-50 p-3 rounded-xl text-center"><div className="font-bold text-gray-900">{job.deadline || 'N/A'}</div><div className="text-xs text-gray-500">Deadline</div></div>
                                    <div className="bg-gray-50 p-3 rounded-xl text-center"><div className="font-bold text-gray-900">{job.clientName || 'N/A'}</div><div className="text-xs text-gray-500">Client</div></div>
                                    <div className="bg-gray-50 p-3 rounded-xl text-center"><div className="font-bold text-gray-900">10</div><div className="text-xs text-gray-500">Connects</div></div>
                                </div>
                                {app.coverLetter && <p className="text-sm text-gray-600 italic mb-3">"{app.coverLetter}"</p>}
                                {app.status === 'accepted' && (
                                    <button onClick={() => navigate('/chat')} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium">💬 Chat with Client</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MyApplications;