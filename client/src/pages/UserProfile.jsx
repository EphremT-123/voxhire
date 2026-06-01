import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const UserProfile = () => {
    const { id } = useParams();
    const currentUser = useAuthStore((s) => s.user);
    const [profile, setProfile] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get(`/users/${id}`);
                setProfile(data);
                setIsFollowing(data.followers?.some(f => f._id === currentUser._id));
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, [id]);

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await api.post(`/users/${id}/unfollow`);
            } else {
                await api.post(`/users/${id}/follow`);
            }
            setIsFollowing(!isFollowing);
        } catch (err) {
            console.error(err);
        }
    };

    if (!profile) return <div><Navbar /><p className="p-6">Loading...</p></div>;

    return (
        <div>
            <Navbar />
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white p-6 rounded shadow">
                    <h1 className="text-2xl font-bold">{profile.name}</h1>
                    <p className="text-gray-500">@{profile.username}</p>
                    <p className="capitalize text-indigo-600 font-semibold">{profile.role}</p>
                    {profile.bio && <p className="mt-2">{profile.bio}</p>}
                    {profile.location && <p className="text-sm text-gray-500">📍 {profile.location}</p>}
                    {profile.email && profile.email !== 'Hidden' &&
                        <p className="text-sm text-gray-500">✉️ {profile.email}</p>}
                    {profile.website && <p className="text-sm text-blue-500">🔗 {profile.website}</p>}

                    <div className="flex gap-4 mt-3 text-sm">
                        <span>{profile.followers?.length || 0} Followers</span>
                        <span>{profile.following?.length || 0} Following</span>
                    </div>

                    {currentUser._id !== id && (
                        <button onClick={handleFollow}
                            className={`mt-4 px-4 py-2 rounded ${isFollowing ? 'bg-gray-400' : 'bg-indigo-600'} text-white`}>
                            {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;