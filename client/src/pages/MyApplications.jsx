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

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/jobs/my/applications');
            console.log('Applications loaded:', data);
            setApplications(data);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError(err.response?.data?.message || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const filteredApps = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter);

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡', label: 'Pending Review' },
            shortlisted: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⭐', label: 'Shortlisted' },
            accepted: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Accepted!' },
            declined: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Declined' },
        };
        return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❓', label: status };
    };

    const getStatusMessage = (app) => {
        const job = app.job || {};
        if (app.status === 'accepted') {
            return `🎉 Congratulations! You've been hired for "${job.title}". The client will contact you soon.`;
        }
        if (app.status === 'shortlisted') {
            return `⭐ You've been shortlisted for "${job.title}". The client is reviewing your application.`;
        }
        if (app.status === 'declined') {
            return app.refunded
                ? `Your application for "${job.title}" was declined. 💎 10 connects refunded.`
                : `Your application for "${job.title}" was declined.`;
        }
        return `Your application for "${job.title}" is pending review by the client.`;
    };

    const statusCounts = {
        all: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        declined: applications.filter(a => a.status === 'declined').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-blue-900">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">

                {/* Header */}
                <div className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-2xl mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-amber-900">My Applications</h1>
                            <p className="text-gray-600 mt-1">Track all your job applications and their status</p>
                        </div>
                        <button onClick={() => navigate('/jobs')}
                            className="bg-gradient-to-r from-amber-700 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition">
                            🔍 Browse More Jobs
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                        <p className="font-semibold">{error}</p>
                        <button onClick={fetchApplications} className="mt-2 text-red-700 underline">Try Again</button>
                    </div>
                )}

                {/* Status Filter */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {Object.entries(statusCounts).map(([key, count]) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`p-4 rounded-xl text-center transition ${filter === key ? 'bg-white shadow-lg ring-2 ring-blue-500' : 'bg-white/80 hover:bg-white'
                                }`}>
                            <div className="text-2xl font-bold text-amber-900">{count}</div>
                            <div className="text-xs text-gray-600 capitalize">{key}</div>
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4 animate-pulse">⏳</div>
                        <p className="text-white text-lg">Loading your applications...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredApps.length === 0 && (
                    <div className="bg-white/95 backdrop-blur rounded-2xl p-12 text-center shadow-xl">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">
                            {applications.length === 0 ? "You haven't applied to any jobs yet" : `No ${filter} applications`}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {applications.length === 0 ? "Browse available jobs and submit your first application!" : "Try a different filter."}
                        </p>
                        <button onClick={() => navigate('/jobs')}
                            className="bg-gradient-to-r from-amber-700 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold">
                            Find Jobs to Apply
                        </button>
                    </div>
                )}

                {/* Applications List */}
                {!loading && filteredApps.length > 0 && (
                    <div className="space-y-4">
                        {filteredApps.map((app) => {
                            const status = getStatusBadge(app.status);
                            const job = app.job || {};
                            return (
                                <div key={app._id} className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-xl hover:shadow-2xl transition">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-amber-900">{job.title || 'Unknown Job'}</h3>
                                            <p className="text-sm text-gray-500 mt-1">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${status.bg} ${status.text}`}>
                                            {status.icon} {status.label}
                                        </span>
                                    </div>

                                    {/* Status Message */}
                                    <div className={`p-4 rounded-xl mb-4 ${app.status === 'accepted' ? 'bg-green-50 border border-green-200' :
                                            app.status === 'shortlisted' ? 'bg-blue-50 border border-blue-200' :
                                                app.status === 'declined' ? 'bg-red-50 border border-red-200' :
                                                    'bg-yellow-50 border border-yellow-200'
                                        }`}>
                                        <p className="text-sm font-medium">{getStatusMessage(app)}</p>
                                    </div>

                                    {/* Job Details */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                                        <div className="bg-amber-50 p-3 rounded-xl text-center">
                                            <div className="text-amber-900 font-bold">${job.budget || 'N/A'}</div>
                                            <div className="text-xs text-gray-600">Budget</div>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded-xl text-center">
                                            <div className="text-blue-900 font-bold">{job.deadline || 'N/A'}</div>
                                            <div className="text-xs text-gray-600">Deadline</div>
                                        </div>
                                        <div className="bg-purple-50 p-3 rounded-xl text-center">
                                            <div className="text-purple-900 font-bold">{job.clientName || 'N/A'}</div>
                                            <div className="text-xs text-gray-600">Client</div>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-xl text-center">
                                            <div className="text-green-900 font-bold">10</div>
                                            <div className="text-xs text-gray-600">Connects Spent</div>
                                        </div>
                                    </div>

                                    {app.coverLetter && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 font-semibold mb-1">YOUR COVER LETTER:</p>
                                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl italic">"{app.coverLetter}"</p>
                                        </div>
                                    )}

                                    {app.refunded && (
                                        <div className="text-green-600 text-sm font-semibold mt-2">💎 10 connects refunded</div>
                                    )}

                                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                                        {app.status === 'accepted' && (
                                            <button onClick={() => navigate('/chat')}
                                                className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition">
                                                💬 Chat with Client
                                            </button>
                                        )}
                                        <button onClick={() => navigate('/jobs')}
                                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                                            View Jobs
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyApplications;