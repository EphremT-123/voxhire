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

    useEffect(() => { fetchApplications(); }, [id]);

    const fetchApplications = async () => {
        try {
            setLoading(true); setError('');
            const { data } = await api.get(`/jobs/${id}/applications`);
            setJob(data.job);
            setApplications(data.applications || []);
        } catch (err) { setError(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    const handleHire = async (appId, artistName) => {
        if (!confirm(`Hire ${artistName}?`)) return;
        try { await api.put(`/jobs/${id}/hire/${appId}`); alert('✅ Hired!'); navigate('/dashboard'); }
        catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleDecline = async (appId) => {
        try { await api.put(`/jobs/applications/${appId}/decline`); fetchApplications(); }
        catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const toggleCompare = (app) => {
        if (compareList.find(a => a._id === app._id)) setCompareList(compareList.filter(a => a._id !== app._id));
        else if (compareList.length < 3) setCompareList([...compareList, app]);
    };

    const getStatusBadge = (s) => ({ pending: 'bg-yellow-100 text-yellow-800', shortlisted: 'bg-blue-100 text-blue-800', accepted: 'bg-green-100 text-green-800', declined: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');

    if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><p className="text-center p-6 text-gray-500">Loading...</p></div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto p-6">
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4">{error}</div>}
                {job && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
                        <div className="flex justify-between items-center">
                            <div><h1 className="text-2xl font-bold text-gray-900">{job.title}</h1><p className="text-gray-500">💰 ${job.budget} | ⏰ {job.deadline} | 📝 {applications.length} applicants</p></div>
                            <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 font-medium">← Back</button>
                        </div>
                    </div>
                )}

                {compareList.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-4">
                        <h3 className="font-bold text-gray-900 mb-3">🔍 Comparing {compareList.length}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {compareList.map(app => (
                                <div key={app._id} className="bg-gray-50 p-4 rounded-xl">
                                    <p className="font-bold text-gray-900">{app.artist?.name || app.artistName}</p>
                                    <p className="text-gray-500">⭐ {app.artist?.rating || 'N/A'}</p>
                                    <p className="text-gray-500">🎙️ {app.artist?.experience || 'N/A'}</p>
                                    {app.coverLetter && <p className="text-gray-600 mt-2 italic text-xs">"{app.coverLetter.substring(0, 100)}..."</p>}
                                    <button onClick={() => toggleCompare(app)} className="text-red-500 text-xs mt-2">Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {applications.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">No applications yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {applications.map(app => (
                            <div key={app._id} className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer ${compareList.find(a => a._id === app._id) ? 'ring-2 ring-gray-900' : ''}`} onClick={() => setSelectedApp(app)}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">{(app.artist?.name || app.artistName)?.charAt(0) || '?'}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{app.artist?.name || app.artistName}</p>
                                        <p className="text-xs text-gray-400 truncate">{app.artist?.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(app.status)}`}>{app.status}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 text-xs mb-3 text-gray-500">
                                    {app.artist?.experience && <span className="bg-gray-100 px-2 py-0.5 rounded">🎙️ {app.artist.experience}</span>}
                                    {app.artist?.rating && <span className="bg-gray-100 px-2 py-0.5 rounded">⭐ {app.artist.rating}</span>}
                                </div>
                                {app.coverLetter ? (
                                    <div className="bg-gray-50 p-3 rounded-xl mb-2"><p className="text-xs text-gray-500 mb-1">COVER LETTER:</p><p className="text-sm text-gray-700 line-clamp-3 italic">"{app.coverLetter}"</p></div>
                                ) : <p className="text-xs text-gray-400 mb-2">No cover letter</p>}
                                {app.portfolioUrl && <a href={app.portfolioUrl} target="_blank" className="text-blue-600 text-xs underline block mb-1" onClick={e => e.stopPropagation()}>🔗 Portfolio Link</a>}
                                {app.portfolioFile && (
                                    <div className="mb-2" onClick={e => e.stopPropagation()}><p className="text-xs text-gray-500 mb-1">🎧 Sample:</p><audio controls className="w-full" style={{ height: '28px' }}><source src={app.portfolioFile} /></audio></div>
                                )}
                                {!app.portfolioUrl && !app.portfolioFile && <p className="text-xs text-gray-400 mb-2">No portfolio</p>}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => toggleCompare(app)} className={`px-2 py-1 rounded-lg text-xs font-medium ${compareList.find(a => a._id === app._id) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>🔍</button>
                                    {app.status !== 'accepted' && app.status !== 'declined' && <>
                                        <button onClick={() => handleHire(app._id, app.artist?.name || app.artistName)} className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-medium">✅ Hire</button>
                                        <button onClick={() => handleDecline(app._id)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-medium">❌</button>
                                    </>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedApp && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedApp(null)}>
                        <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-lg" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-2xl">{(selectedApp.artist?.name || selectedApp.artistName)?.charAt(0) || '?'}</div>
                                    <div><h3 className="text-xl font-bold text-gray-900">{selectedApp.artist?.name || selectedApp.artistName}</h3><p className="text-sm text-gray-400">{selectedApp.artist?.email}</p></div>
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="text-gray-400 text-2xl">✕</button>
                            </div>
                            {/* ...rest of details similar to previous, with gray styling... */}
                            <div className="flex gap-3 pt-4 border-t">
                                {selectedApp.status !== 'accepted' && selectedApp.status !== 'declined' && <>
                                    <button onClick={() => { handleHire(selectedApp._id, selectedApp.artist?.name || selectedApp.artistName); setSelectedApp(null); }} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-medium flex-1">✅ Hire</button>
                                    <button onClick={() => { handleDecline(selectedApp._id); setSelectedApp(null); }} className="bg-red-500 text-white px-6 py-2 rounded-xl font-medium">❌ Decline</button>
                                </>}
                                <button onClick={() => setSelectedApp(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-medium">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Applications;