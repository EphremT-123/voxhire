import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Dashboard = () => {
    const user = useAuthStore((s) => s.user);
    const fetchUser = useAuthStore((s) => s.fetchUser);
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [posts, setPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [myApps, setMyApps] = useState([]);
    const [activeTab, setActiveTab] = useState('all');

    // Apply modal states
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyJobId, setApplyJobId] = useState(null);
    const [applyJobTitle, setApplyJobTitle] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [portfolioFile, setPortfolioFile] = useState(null);
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [applying, setApplying] = useState(false);

    // Video call states
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoCallUser, setVideoCallUser] = useState('');

    useEffect(() => {
        if (!user) fetchUser();
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            const [jobsRes, postsRes] = await Promise.all([api.get('/jobs'), api.get('/posts')]);
            setJobs(jobsRes.data || []);
            setPosts(postsRes.data || []);
        } catch (err) { console.error(err); }
        if (user?.role === 'artist') {
            try {
                const { data } = await api.get('/jobs/my/applications');
                setMyApps(data || []);
            } catch (err) { }
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value.trim() === '') {
            setSearchResults([]);
            return;
        }
        const term = e.target.value.toLowerCase();
        const results = jobs.filter(j =>
            j.title.toLowerCase().includes(term) ||
            j.description?.toLowerCase().includes(term) ||
            j.clientName?.toLowerCase().includes(term)
        );
        setSearchResults(results);
    };

    const handleApplySubmit = async () => {
        setApplying(true);
        try {
            const formData = new FormData();

            // CRITICAL: Always send coverLetter
            formData.append('coverLetter', coverLetter || '');
            console.log('📤 Sending coverLetter:', coverLetter);

            if (portfolioUrl && portfolioUrl.trim() !== '') {
                formData.append('portfolioUrl', portfolioUrl.trim());
                console.log('📤 Sending portfolioUrl:', portfolioUrl);
            }

            if (portfolioFile) {
                formData.append('portfolio', portfolioFile);
                console.log('📤 Sending portfolio file:', portfolioFile.name);
            }

            // Debug FormData
            console.log('📦 FormData contents:');
            for (let pair of formData.entries()) {
                console.log('  -', pair[0] + ':', typeof pair[1] === 'string' ? pair[1] : '(file)');
            }

            const response = await api.post(`/jobs/${applyJobId}/apply`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('✅ Server response:', response.data);

            setShowApplyModal(false);
            setCoverLetter('');
            setPortfolioFile(null);
            setPortfolioUrl('');
            alert('✅ Application submitted successfully! 10 connects spent.');
            loadAllData();
        } catch (err) {
            console.error('❌ Apply error:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to apply';
            alert('❌ ' + errorMsg);
        } finally {
            setApplying(false);
        }
    };

    const getStatusBadge = (status) => {
        const b = {
            pending: 'bg-yellow-100 text-yellow-800',
            shortlisted: 'bg-blue-100 text-blue-800',
            accepted: 'bg-green-100 text-green-800',
            declined: 'bg-red-100 text-red-800'
        };
        return b[status] || 'bg-gray-100 text-gray-800';
    };

    const displayedJobs = searchTerm ? searchResults : jobs;

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 text-xl">
            Loading...
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto p-4 md:p-6">

                {/* Welcome + Search */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user.name}! 👋</h1>
                    <p className="text-gray-500 mt-1">@{user.username} · {user.role} · 💎 {user.connects} connects</p>

                    <div className="mt-4 relative">
                        <input
                            type="text"
                            placeholder="🔍 Search jobs by title, description, or client..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800 placeholder-gray-400"
                        />
                        {searchTerm && (
                            <span className="absolute right-4 top-4 text-gray-400">{searchResults.length} results</span>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
                        <div className="text-xs text-gray-500">Open Jobs</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
                        <div className="text-xs text-gray-500">Posts</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-2xl font-bold text-gray-900">{user.connects || 0}</div>
                        <div className="text-xs text-gray-500">Connects</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-2xl font-bold text-gray-900">{myApps.length}</div>
                        <div className="text-xs text-gray-500">Applications</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    <button onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>All</button>
                    <button onClick={() => setActiveTab('jobs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'jobs' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>📋 Jobs</button>
                    <button onClick={() => setActiveTab('posts')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'posts' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>📝 Posts</button>
                    {user?.role === 'artist' && (
                        <button onClick={() => setActiveTab('myapps')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'myapps' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>📋 My Applications</button>
                    )}
                </div>

                {/* Jobs Section */}
                {(activeTab === 'all' || activeTab === 'jobs') && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {searchTerm ? `Search Results (${displayedJobs.length})` : `📋 Available Jobs (${displayedJobs.length})`}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayedJobs.map(job => (
                                <div key={job._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                                    <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{job.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">💰 ${job.budget}</span>
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">⏰ {job.deadline}</span>
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">⚡ {job.urgency}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">👔 {job.clientName}</p>

                                    <div className="flex gap-2 mt-4">
                                        {user?.role === 'artist' && job.status === 'open' && (
                                            <button
                                                onClick={() => {
                                                    setApplyJobId(job._id);
                                                    setApplyJobTitle(job.title);
                                                    setShowApplyModal(true);
                                                    setCoverLetter('');
                                                    setPortfolioFile(null);
                                                    setPortfolioUrl('');
                                                }}
                                                className="w-full bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800"
                                            >
                                                🎯 Apply Now (10 connects)
                                            </button>
                                        )}
                                        {user?.role === 'client' && job.client?._id === user._id && (
                                            <button
                                                onClick={() => navigate(`/applications/${job._id}`)}
                                                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50"
                                            >
                                                📋 View Applications
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {displayedJobs.length === 0 && (
                            <div className="text-center py-8 bg-white border border-gray-200 rounded-2xl">
                                <p className="text-gray-500 text-lg">No jobs found{searchTerm ? ` matching "${searchTerm}"` : ''}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Posts Section */}
                {(activeTab === 'all' || activeTab === 'posts') && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Portfolio Posts</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {posts.map(post => (
                                <div key={post._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                                            {post.user?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{post.user?.name}</p>
                                            <p className="text-xs text-gray-400">@{post.user?.username} · {new Date(post.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 mb-3">{post.text}</p>
                                    {post.image && (
                                        <img src={post.image} alt="Post" className="w-full rounded-xl mb-3 max-h-64 object-cover" />
                                    )}
                                    <div className="flex gap-4 text-sm text-gray-400">
                                        <span>❤️ {post.likes?.length || 0}</span>
                                        <span>💬 {post.comments?.length || 0}</span>
                                        <span>🔄 {post.shares?.length || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Applications Section (Artist) */}
                {(activeTab === 'all' || activeTab === 'myapps') && user?.role === 'artist' && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 My Applications ({myApps.length})</h2>
                        {myApps.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                                <p className="text-gray-500">No applications yet. Browse jobs above!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myApps.map(app => {
                                    const job = app.job || {};
                                    return (
                                        <div key={app._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{job.title || 'Unknown Job'}</h3>
                                                    <p className="text-xs text-gray-400">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(app.status)}`}>
                                                    {app.status === 'accepted' ? '✅ Accepted!' :
                                                        app.status === 'shortlisted' ? '⭐ Shortlisted' :
                                                            app.status === 'declined' ? '❌ Declined' : '🟡 Pending'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                                <span className="bg-gray-100 px-2 py-1 rounded">💰 ${job.budget}</span>
                                                <span className="bg-gray-100 px-2 py-1 rounded">👔 {job.clientName}</span>
                                                <span className="bg-gray-100 px-2 py-1 rounded">💎 10 connects</span>
                                            </div>

                                            {app.status === 'accepted' && (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                                                    <p className="text-green-800 font-semibold text-sm">🎉 Congratulations! You've been hired!</p>
                                                    <div className="flex gap-2 mt-3">
                                                        <button onClick={() => navigate('/chat')}
                                                            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800">💬 Chat</button>
                                                        <button onClick={() => { setVideoCallUser(job.clientName || 'Client'); setShowVideoModal(true); }}
                                                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">📹 Video Call</button>
                                                    </div>
                                                </div>
                                            )}
                                            {app.status === 'shortlisted' && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                                    <p className="text-blue-800 text-sm">⭐ You've been shortlisted!</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ============ APPLY MODAL ============ */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowApplyModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Apply for: {applyJobTitle}</h3>
                            <button onClick={() => setShowApplyModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">⚠️ This costs <strong>10 connects ($0.10)</strong></p>

                        <div className="mb-4">
                            <label className="block font-semibold text-gray-900 mb-2">Cover Letter *</label>
                            <textarea
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                placeholder="Tell the client why you're the best fit..."
                                className="w-full p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                                rows="4"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block font-semibold text-gray-900 mb-2">Portfolio URL (optional)</label>
                            <input
                                type="url"
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                placeholder="https://your-portfolio.com"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block font-semibold text-gray-900 mb-2">Upload Portfolio (audio/video)</label>
                            <input
                                type="file"
                                accept="audio/*,video/*"
                                onChange={(e) => setPortfolioFile(e.target.files[0])}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800 bg-white"
                            />
                            {portfolioFile && (
                                <p className="text-sm text-green-600 mt-1">✅ {portfolioFile.name} ({(portfolioFile.size / 1024).toFixed(0)} KB)</p>
                            )}
                        </div>

                        <button
                            onClick={handleApplySubmit}
                            disabled={applying}
                            className="w-full bg-gray-900 text-white p-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50"
                        >
                            {applying ? '⏳ Submitting...' : '✅ Submit Application (10 connects)'}
                        </button>
                    </div>
                </div>
            )}

            {/* ============ VIDEO CALL MODAL ============ */}
            {showVideoModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowVideoModal(false)}>
                    <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">📹 Video Call with {videoCallUser}</h3>
                            <button onClick={() => setShowVideoModal(false)} className="text-white hover:text-red-400 text-2xl">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-800 rounded-xl h-48 flex items-center justify-center">
                                <div className="text-center"><span className="text-5xl">🎥</span><p className="text-white text-sm mt-2">You</p></div>
                            </div>
                            <div className="bg-gray-800 rounded-xl h-48 flex items-center justify-center">
                                <div className="text-center"><span className="text-5xl">📹</span><p className="text-white text-sm mt-2">{videoCallUser}</p></div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4">
                            <button className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-600">🎤 Mute</button>
                            <button className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-600">📷 Stop Video</button>
                            <button onClick={() => setShowVideoModal(false)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700">🔴 End Call</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;