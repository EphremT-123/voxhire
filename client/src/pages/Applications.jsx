import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const Applications = () => {
    const { id } = useParams();
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [compareList, setCompareList] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchApplications();
    }, [id]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get(`/jobs/${id}/applications`);
            console.log('Applications loaded:', data.applications?.length);
            setJob(data.job);
            setApplications(data.applications || []);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError(err.response?.data?.message || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async (appId, artistName) => {
        if (!confirm(`Hire ${artistName}? All other applicants will be declined and refunded.`)) return;
        try {
            await api.put(`/jobs/${id}/hire/${appId}`);
            alert('✅ Artist hired successfully!');
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to hire');
        }
    };

    const handleDecline = async (appId) => {
        try {
            await api.put(`/jobs/applications/${appId}/decline`);
            fetchApplications();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to decline');
        }
    };

    const toggleCompare = (app) => {
        if (compareList.find(a => a._id === app._id)) {
            setCompareList(compareList.filter(a => a._id !== app._id));
        } else if (compareList.length < 3) {
            setCompareList([...compareList, app]);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            shortlisted: 'bg-blue-100 text-blue-800',
            accepted: 'bg-green-100 text-green-800',
            declined: 'bg-red-100 text-red-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-900 to-blue-900">
                <Navbar />
                <div className="flex items-center justify-center h-64 text-white text-xl">
                    <div className="text-center">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        Loading applications...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-blue-900">
            <Navbar />
            <div className="max-w-7xl mx-auto p-6">

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4">
                        {error}
                        <button onClick={fetchApplications} className="ml-4 underline">Retry</button>
                    </div>
                )}

                {job && (
                    <div className="bg-white/95 rounded-2xl p-6 shadow-2xl mb-6">
                        <div className="flex justify-between items-center flex-wrap gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-amber-900">{job.title}</h1>
                                <p className="text-gray-600 mt-1">
                                    💰 ${job.budget} | ⏰ {job.deadline} | 📝 {applications.length} applicants
                                </p>
                            </div>
                            <button onClick={() => navigate('/dashboard')} className="text-amber-900 hover:text-blue-700 font-semibold">
                                ← Back to Jobs
                            </button>
                        </div>
                    </div>
                )}

                {/* Compare Bar */}
                {compareList.length > 0 && (
                    <div className="bg-white/95 rounded-2xl p-4 shadow-xl mb-4">
                        <h3 className="font-bold text-amber-900 mb-3">🔍 Comparing {compareList.length} Applicants</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {compareList.map(app => (
                                <div key={app._id} className="bg-amber-50 p-4 rounded-xl">
                                    <p className="font-bold text-amber-900">{app.artist?.name || app.artistName}</p>
                                    <p className="text-gray-600">⭐ {app.artist?.rating || 'N/A'}</p>
                                    <p className="text-gray-600">🎙️ {app.artist?.experience || 'N/A'}</p>
                                    <p className="text-gray-600">🗣️ {app.artist?.languages || 'N/A'}</p>
                                    <p className="text-gray-600">📍 {app.artist?.location || 'N/A'}</p>
                                    {app.coverLetter && (
                                        <p className="text-gray-600 mt-2 italic text-xs">"{app.coverLetter.substring(0, 100)}..."</p>
                                    )}
                                    {/* Show portfolio in compare */}
                                    {app.portfolioUrl && <p className="text-blue-600 text-xs mt-1">🔗 Portfolio</p>}
                                    {app.portfolioFile && <p className="text-green-600 text-xs mt-1">🎧 Audio Sample</p>}
                                    <button onClick={() => toggleCompare(app)} className="text-red-500 text-xs mt-2 block">Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Applications Grid */}
                {applications.length === 0 ? (
                    <div className="bg-white/50 rounded-2xl p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-white text-lg">No applications yet for this job.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {applications.map(app => (
                            <div
                                key={app._id}
                                className={`bg-white/95 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition cursor-pointer ${compareList.find(a => a._id === app._id) ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => setSelectedApp(app)}
                            >
                                {/* Artist Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                        {(app.artist?.name || app.artistName)?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-amber-900 truncate">{app.artist?.name || app.artistName}</p>
                                        <p className="text-xs text-gray-500 truncate">{app.artist?.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(app.status)}`}>
                                        {app.status}
                                    </span>
                                </div>

                                {/* Artist Quick Info */}
                                <div className="flex flex-wrap gap-1 text-xs mb-3 text-gray-600">
                                    {app.artist?.experience && <span className="bg-amber-50 px-2 py-0.5 rounded">🎙️ {app.artist.experience}</span>}
                                    {app.artist?.rating && <span className="bg-yellow-50 px-2 py-0.5 rounded">⭐ {app.artist.rating}</span>}
                                    {app.artist?.languages && <span className="bg-blue-50 px-2 py-0.5 rounded">🗣️ {app.artist.languages}</span>}
                                </div>

                                {/* Cover Letter */}
                                {app.coverLetter ? (
                                    <div className="bg-gray-50 p-3 rounded-xl mb-2">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">COVER LETTER:</p>
                                        <p className="text-sm text-gray-700 line-clamp-3 italic">"{app.coverLetter}"</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic mb-2">No cover letter provided</p>
                                )}

                                {/* Portfolio from Application */}
                                {app.portfolioUrl && (
                                    <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-blue-600 text-xs underline block mb-1"
                                        onClick={(e) => e.stopPropagation()}>🔗 Portfolio Link</a>
                                )}
                                {app.portfolioFile && (
                                    <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                        <p className="text-xs text-gray-500 mb-1">🎧 Audio Sample:</p>
                                        <audio controls className="w-full" style={{ height: '28px' }}>
                                            <source src={app.portfolioFile} />
                                        </audio>
                                    </div>
                                )}

                                {/* Artist Profile Portfolio */}
                                {app.artist?.portfolio && app.artist.portfolio.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-xs text-gray-500 mb-1">🎬 Artist Portfolio ({app.artist.portfolio.length} items):</p>
                                        <div className="flex gap-1 flex-wrap">
                                            {app.artist.portfolio.slice(0, 3).map(item => (
                                                <span key={item._id} className="bg-purple-50 text-purple-800 text-xs px-2 py-0.5 rounded">
                                                    {item.type === 'audio' ? '🎧' : item.type === 'video' ? '🎬' : item.type === 'image' ? '🖼️' : '🔗'} {item.title}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!app.portfolioUrl && !app.portfolioFile && (!app.artist?.portfolio || app.artist.portfolio.length === 0) && (
                                    <p className="text-xs text-gray-400 italic mb-2">No portfolio provided</p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => toggleCompare(app)}
                                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${compareList.find(a => a._id === app._id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                        🔍 Compare
                                    </button>
                                    {app.status !== 'accepted' && app.status !== 'declined' && (
                                        <>
                                            <button onClick={() => handleHire(app._id, app.artist?.name || app.artistName)}
                                                className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-600">✅ Hire</button>
                                            <button onClick={() => handleDecline(app._id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-600">❌</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ============ DETAIL MODAL ============ */}
                {selectedApp && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedApp(null)}>
                        <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                                        {(selectedApp.artist?.name || selectedApp.artistName)?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-amber-900">{selectedApp.artist?.name || selectedApp.artistName}</h3>
                                        <p className="text-sm text-gray-500">{selectedApp.artist?.email}</p>
                                        <button onClick={() => navigate(`/profile/${selectedApp.artist?._id}`)}
                                            className="text-blue-600 text-xs hover:underline">View Full Profile →</button>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="bg-amber-50 p-3 rounded-xl">
                                    <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(selectedApp.status)}`}>{selectedApp.status}</span></p>
                                    <p><strong>Applied:</strong> {new Date(selectedApp.createdAt).toLocaleDateString()}</p>
                                    <p><strong>Connects Spent:</strong> 10</p>
                                </div>

                                {selectedApp.artist?.bio && (
                                    <div>
                                        <p className="font-semibold text-amber-900">Bio:</p>
                                        <p className="text-gray-700">{selectedApp.artist.bio}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    {selectedApp.artist?.experience && (
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <p className="font-semibold text-xs text-blue-800">Experience</p>
                                            <p className="text-sm">{selectedApp.artist.experience}</p>
                                        </div>
                                    )}
                                    {selectedApp.artist?.rating && (
                                        <div className="bg-yellow-50 p-2 rounded-lg">
                                            <p className="font-semibold text-xs text-yellow-800">Rating</p>
                                            <p className="text-sm">⭐ {selectedApp.artist.rating}</p>
                                        </div>
                                    )}
                                    {selectedApp.artist?.languages && (
                                        <div className="bg-green-50 p-2 rounded-lg">
                                            <p className="font-semibold text-xs text-green-800">Languages</p>
                                            <p className="text-sm">{selectedApp.artist.languages}</p>
                                        </div>
                                    )}
                                    {selectedApp.artist?.location && (
                                        <div className="bg-purple-50 p-2 rounded-lg">
                                            <p className="font-semibold text-xs text-purple-800">Location</p>
                                            <p className="text-sm">{selectedApp.artist.location}</p>
                                        </div>
                                    )}
                                    {selectedApp.artist?.equipment && (
                                        <div className="bg-red-50 p-2 rounded-lg">
                                            <p className="font-semibold text-xs text-red-800">Equipment</p>
                                            <p className="text-sm">{selectedApp.artist.equipment}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Cover Letter */}
                                <div>
                                    <p className="font-semibold text-amber-900">Cover Letter:</p>
                                    {selectedApp.coverLetter ? (
                                        <p className="text-gray-700 italic bg-gray-50 p-3 rounded-xl mt-1">"{selectedApp.coverLetter}"</p>
                                    ) : (
                                        <p className="text-gray-400 italic">No cover letter provided</p>
                                    )}
                                </div>

                                {/* Application Portfolio */}
                                {selectedApp.portfolioUrl && (
                                    <div>
                                        <p className="font-semibold text-amber-900">Portfolio Link:</p>
                                        <a href={selectedApp.portfolioUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-blue-600 underline block break-all mt-1">{selectedApp.portfolioUrl}</a>
                                    </div>
                                )}
                                {selectedApp.portfolioFile && (
                                    <div>
                                        <p className="font-semibold text-amber-900 mb-1">Audio/Video Sample:</p>
                                        <audio controls className="w-full"><source src={selectedApp.portfolioFile} /></audio>
                                    </div>
                                )}

                                {/* Artist Profile Portfolio */}
                                {selectedApp.artist?.portfolio && selectedApp.artist.portfolio.length > 0 && (
                                    <div>
                                        <p className="font-semibold text-amber-900 mb-2">🎬 Artist Portfolio ({selectedApp.artist.portfolio.length} items):</p>
                                        <div className="space-y-3">
                                            {selectedApp.artist.portfolio.map(item => (
                                                <div key={item._id} className="bg-gray-50 p-3 rounded-xl">
                                                    <p className="font-semibold text-sm">{item.title}</p>
                                                    {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
                                                    {item.type === 'audio' && <audio controls className="w-full mt-1"><source src={item.url} /></audio>}
                                                    {item.type === 'video' && <video controls className="w-full mt-1 rounded"><source src={item.url} /></video>}
                                                    {item.type === 'image' && <img src={item.url} alt={item.title} className="w-full mt-1 rounded" />}
                                                    {item.type === 'link' && <a href={item.url} target="_blank" className="text-blue-600 text-xs">{item.url}</a>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                    {selectedApp.status !== 'accepted' && selectedApp.status !== 'declined' && (
                                        <>
                                            <button onClick={() => { handleHire(selectedApp._id, selectedApp.artist?.name || selectedApp.artistName); setSelectedApp(null); }}
                                                className="bg-green-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-600 flex-1">✅ Hire Artist</button>
                                            <button onClick={() => { handleDecline(selectedApp._id); setSelectedApp(null); }}
                                                className="bg-red-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-600">❌ Decline</button>
                                        </>
                                    )}
                                    <button onClick={() => setSelectedApp(null)}
                                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-semibold hover:bg-gray-300">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Applications;