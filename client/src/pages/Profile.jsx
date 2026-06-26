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
    const fileInputRef = useRef(null);

    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [uploadingPic, setUploadingPic] = useState(false);

    const profileId = id || user?._id;
    const isOwnProfile = !id || id === user?._id;
    const isArtist = profile?.role === 'artist';
    const isClient = profile?.role === 'client';

    useEffect(() => {
        if (profileId) fetchProfile();
    }, [profileId]);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get(`/users/${profileId}`);
            setProfile(data);
            setIsFollowing(data.followers?.some(f => f._id === user?._id));
            setEditForm(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) await api.post(`/users/${profileId}/unfollow`);
            else await api.post(`/users/${profileId}/follow`);
            setIsFollowing(!isFollowing);
            fetchProfile();
        } catch (err) { console.error(err); }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const fields = isArtist ? ['bio', 'location', 'experience', 'languages', 'website'] : ['bio', 'location', 'companySize', 'industry', 'website'];
            const updates = {};
            fields.forEach(f => { if (editForm[f] !== undefined) updates[f] = editForm[f]; });
            await api.put('/users/profile', updates);
            setEditing(false);
            fetchProfile();
        } catch (err) { alert('Failed to save'); }
        finally { setSaving(false); }
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingPic(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const { data } = await api.post('/users/profile-picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setProfile({ ...profile, profilePicture: data.profilePicture });
        } catch (err) { alert('Failed to upload'); }
        finally { setUploadingPic(false); }
    };

    if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><p className="text-center p-6 text-gray-500">Loading...</p></div>;

    // Rule: artists cannot view client profiles
    if (user.role === 'artist' && profile && isClient && !isOwnProfile) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Private Profile</h2>
                        <p className="text-gray-500">You cannot view this client's profile.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">
                {/* Profile Header */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={() => isOwnProfile && fileInputRef.current?.click()}>
                            {profile.profilePicture ? (
                                <img src={profile.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-4xl">{profile.name?.charAt(0) || '?'}</div>
                            )}
                            {isOwnProfile && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="text-white text-xs font-semibold">{uploadingPic ? '⏳' : '📷'}</span></div>}
                            {isOwnProfile && <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                            <p className="text-gray-400">@{profile.username}</p>
                            <p className="capitalize text-gray-600 font-semibold">{profile.role}</p>
                            {profile.bio && <p className="text-gray-700 mt-2">{profile.bio}</p>}
                            <div className="flex gap-4 mt-2 text-sm text-gray-500 flex-wrap justify-center md:justify-start">
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
                                <button onClick={handleFollow} className={`px-6 py-2 rounded-xl font-medium ${isFollowing ? 'bg-gray-200 text-gray-700' : 'bg-gray-900 text-white'}`}>
                                    {isFollowing ? 'Unfollow' : 'Follow'}
                                </button>
                            )}
                            {isOwnProfile && !editing && (
                                <button onClick={() => setEditing(true)} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-medium">✏️ Edit Profile</button>
                            )}
                        </div>
                    </div>

                    {editing && (
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-gray-900 mb-3">Edit Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(isArtist ? ['bio', 'location', 'experience', 'languages', 'website'] : ['bio', 'location', 'companySize', 'industry', 'website']).map(field => (
                                    <div key={field}><label className="text-xs font-semibold capitalize">{field}</label>
                                        <input value={editForm[field] || ''} onChange={e => setEditForm({ ...editForm, [field]: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={handleSaveProfile} disabled={saving} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm">{saving ? 'Saving...' : '💾 Save'}</button>
                                <button onClick={() => setEditing(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* No portfolio section – removed */}
                {/* The profile page now shows only the basic information above */}
            </div>
        </div>
    );
};

export default Profile;