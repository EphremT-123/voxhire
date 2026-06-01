import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const Profile = () => {
    const { id } = useParams();
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('portfolio');
    const fileInputRef = useRef(null);

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Add portfolio (artists only)
    const [showAddPortfolio, setShowAddPortfolio] = useState(false);
    const [portfolioTitle, setPortfolioTitle] = useState('');
    const [portfolioDesc, setPortfolioDesc] = useState('');
    const [portfolioFile, setPortfolioFile] = useState(null);
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Profile picture upload
    const [uploadingPic, setUploadingPic] = useState(false);

    const profileId = id || user?._id;
    const isOwnProfile = !id || id === user?._id;
    const isArtist = profile?.role === 'artist';

    useEffect(() => {
        if (profileId) fetchProfile();
    }, [profileId]);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get(`/users/${profileId}`);
            setProfile(data);
            setIsFollowing(data.followers?.some(f => f._id === user?._id));
            setEditForm(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await api.post(`/users/${profileId}/unfollow`);
            } else {
                await api.post(`/users/${profileId}/follow`);
            }
            setIsFollowing(!isFollowing);
            fetchProfile();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const fields = isArtist
                ? ['bio', 'location', 'experience', 'languages', 'website']
                : ['bio', 'location', 'companySize', 'industry', 'website'];

            const updates = {};
            fields.forEach(f => {
                if (editForm[f] !== undefined) updates[f] = editForm[f];
            });

            await api.put('/users/profile', updates);
            setEditing(false);
            fetchProfile();
        } catch (err) {
            alert('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log('Uploading profile picture:', file.name, file.type, file.size);
        setUploadingPic(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            console.log('Sending request...');
            const { data } = await api.post('/users/profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Upload response:', data);
            setProfile({ ...profile, profilePicture: data.profilePicture });
            alert('✅ Profile picture updated!');
        } catch (err) {
            console.error('Upload error:', err);
            console.error('Response:', err.response?.data);
            alert('Failed to upload: ' + (err.response?.data?.message || err.response?.data?.error || err.message));
        } finally {
            setUploadingPic(false);
        }
    };

    const handleAddPortfolio = async () => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', portfolioTitle || 'Untitled');
            formData.append('description', portfolioDesc);
            if (portfolioFile) {
                formData.append('file', portfolioFile);
            } else if (portfolioUrl) {
                formData.append('url', portfolioUrl);
                formData.append('type', 'link');
            }
            await api.post('/users/portfolio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowAddPortfolio(false);
            setPortfolioTitle('');
            setPortfolioDesc('');
            setPortfolioFile(null);
            setPortfolioUrl('');
            fetchProfile();
        } catch (err) {
            alert('Failed to upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePortfolio = async (itemId) => {
        if (!confirm('Delete this portfolio item?')) return;
        try {
            await api.delete(`/users/portfolio/${itemId}`);
            fetchProfile();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 to-blue-900">
            <Navbar />
            <p className="text-white text-center p-6">Loading profile...</p>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 to-blue-900">
            <Navbar />
            <p className="text-white text-center p-6">User not found</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-blue-900">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">

                {/* Profile Header */}
                <div className="bg-white/95 rounded-2xl p-6 shadow-2xl mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">

                        {/* Profile Picture */}
                        <div className="relative group cursor-pointer" onClick={() => isOwnProfile && fileInputRef.current?.click()}>
                            {profile.profilePicture ? (
                                <img src={profile.profilePicture} alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-amber-200" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white font-bold text-4xl">
                                    {profile.name?.charAt(0) || '?'}
                                </div>
                            )}
                            {isOwnProfile && (
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <span className="text-white text-xs font-semibold">{uploadingPic ? '⏳' : '📷 Change'}</span>
                                </div>
                            )}
                            {isOwnProfile && (
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl font-bold text-amber-900">{profile.name}</h1>
                            <p className="text-gray-500">@{profile.username}</p>
                            <p className="capitalize text-blue-700 font-semibold">{profile.role}</p>
                            {profile.bio && <p className="text-gray-700 mt-2">{profile.bio}</p>}
                            <div className="flex gap-4 mt-2 text-sm text-gray-600 flex-wrap justify-center md:justify-start">
                                {profile.location && <span>📍 {profile.location}</span>}
                                {profile.experience && <span>🎙️ {profile.experience}</span>}
                                {profile.rating && <span>⭐ {profile.rating}</span>}
                                {profile.languages && <span>🗣️ {profile.languages}</span>}
                            </div>
                            <div className="flex gap-4 mt-3 text-sm">
                                <span><strong>{profile.followers?.length || 0}</strong> Followers</span>
                                <span><strong>{profile.following?.length || 0}</strong> Following</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {!isOwnProfile && (
                                <button onClick={handleFollow}
                                    className={`px-6 py-2 rounded-xl font-semibold ${isFollowing ? 'bg-gray-300 text-gray-700' : 'bg-blue-600 text-white'}`}>
                                    {isFollowing ? 'Unfollow' : 'Follow'}
                                </button>
                            )}
                            {isOwnProfile && !editing && (
                                <button onClick={() => setEditing(true)} className="bg-amber-600 text-white px-6 py-2 rounded-xl font-semibold">
                                    ✏️ Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Edit Form */}
                    {editing && (
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-amber-900 mb-3">Edit Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {isArtist ? (
                                    <>
                                        {['bio', 'location', 'experience', 'languages', 'website'].map(field => (
                                            <div key={field}>
                                                <label className="text-xs font-semibold capitalize">{field}</label>
                                                <input value={editForm[field] || ''}
                                                    onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                                                    className="w-full p-2 border rounded-lg text-sm" />
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {['bio', 'location', 'companySize', 'industry', 'website'].map(field => (
                                            <div key={field}>
                                                <label className="text-xs font-semibold capitalize">{field}</label>
                                                <input value={editForm[field] || ''}
                                                    onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                                                    className="w-full p-2 border rounded-lg text-sm" />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={handleSaveProfile} disabled={saving}
                                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm">{saving ? 'Saving...' : '💾 Save'}</button>
                                <button onClick={() => setEditing(false)} className="bg-gray-300 px-4 py-2 rounded-xl text-sm">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Portfolio Section - ARTISTS ONLY */}
                {isArtist && (
                    <>
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => setActiveTab('portfolio')}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === 'portfolio' ? 'bg-white text-amber-900' : 'bg-white/50 text-white'}`}>
                                🎬 Portfolio
                            </button>
                        </div>

                        {activeTab === 'portfolio' && (
                            <div>
                                {isOwnProfile && (
                                    <button onClick={() => setShowAddPortfolio(true)}
                                        className="bg-white text-amber-900 px-4 py-2 rounded-xl font-semibold mb-4">
                                        ➕ Add Portfolio Item
                                    </button>
                                )}

                                {showAddPortfolio && (
                                    <div className="bg-white/95 rounded-2xl p-4 mb-4">
                                        <input value={portfolioTitle} onChange={e => setPortfolioTitle(e.target.value)}
                                            placeholder="Title" className="w-full p-2 border rounded-lg mb-2" />
                                        <input value={portfolioDesc} onChange={e => setPortfolioDesc(e.target.value)}
                                            placeholder="Description" className="w-full p-2 border rounded-lg mb-2" />
                                        <input type="file" accept="audio/*,video/*,image/*"
                                            onChange={e => setPortfolioFile(e.target.files[0])} className="w-full p-2 border rounded-lg mb-2" />
                                        <p className="text-xs text-gray-500 mb-2">OR paste a URL:</p>
                                        <input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
                                            placeholder="https://..." className="w-full p-2 border rounded-lg mb-2" />
                                        <div className="flex gap-2">
                                            <button onClick={handleAddPortfolio} disabled={uploading}
                                                className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm">{uploading ? 'Uploading...' : '✅ Add'}</button>
                                            <button onClick={() => setShowAddPortfolio(false)} className="bg-gray-300 px-4 py-2 rounded-xl text-sm">Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {profile.portfolio?.length === 0 ? (
                                    <div className="bg-white/50 rounded-2xl p-8 text-center">
                                        <p className="text-white">No portfolio items yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {profile.portfolio?.map(item => (
                                            <div key={item._id} className="bg-white/95 rounded-2xl p-4 shadow-xl">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-amber-900">{item.title}</h4>
                                                        <p className="text-xs text-gray-500">{item.type} • {new Date(item.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    {isOwnProfile && (
                                                        <button onClick={() => handleDeletePortfolio(item._id)} className="text-red-500 text-sm">🗑️</button>
                                                    )}
                                                </div>
                                                {item.description && <p className="text-sm text-gray-700 mb-2">{item.description}</p>}
                                                {item.type === 'audio' && <audio controls className="w-full"><source src={item.url} /></audio>}
                                                {item.type === 'video' && <video controls className="w-full rounded-lg"><source src={item.url} /></video>}
                                                {item.type === 'image' && <img src={item.url} alt={item.title} className="w-full rounded-lg" />}
                                                {item.type === 'link' && <a href={item.url} target="_blank" className="text-blue-600 underline text-sm">{item.url}</a>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Profile;