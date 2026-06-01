import { useState, useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const VoiceProfile = () => {
    const user = useAuthStore((s) => s.user);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [language, setLanguage] = useState('English');
    const [accent, setAccent] = useState('American');
    const [gender, setGender] = useState('male');
    const [selfVoiceStyle, setSelfVoiceStyle] = useState('');
    const [audioFile, setAudioFile] = useState(null);

    // Fetch existing profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/voice/profile');
                setProfile(data);
                setLanguage(data.language || 'English');
                setAccent(data.accent || 'American');
                setGender(data.gender || 'male');
                setSelfVoiceStyle(data.selfVoiceStyle?.join(', ') || '');
            } catch (err) {
                if (err.response?.status !== 404) console.log(err);
            }
        };
        if (user?.role === 'artist') fetchProfile();
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setAudioFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!audioFile) {
            setError('Please select an audio file');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('language', language);
            formData.append('accent', accent);
            formData.append('gender', gender);
            formData.append('selfVoiceStyle', selfVoiceStyle);

            const { data } = await api.post('/voice/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfile(data);
            setSuccess('Profile updated successfully! AI voice style: ' + data.aiVoiceStyle?.join(', '));
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
                <h2 className="text-2xl font-bold mb-6">Artist Voice Profile</h2>

                {error && <p className="text-red-500 mb-3">{error}</p>}
                {success && <p className="text-green-600 mb-3">{success}</p>}

                {profile && (
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                        <h3 className="font-semibold mb-2">Current Profile</h3>
                        <p>Language: {profile.language}</p>
                        <p>Accent: {profile.accent}</p>
                        <p>Gender: {profile.gender}</p>
                        <p>Self Styles: {profile.selfVoiceStyle?.join(', ')}</p>
                        <p>AI Detected Styles: <span className="font-bold text-indigo-600">{profile.aiVoiceStyle?.join(', ')}</span></p>
                        {profile.demoUrl && (
                            <div className="mt-2">
                                <p className="mb-1">Demo:</p>
                                <audio controls className="w-full">
                                    <source src={profile.demoUrl} type="audio/mp4" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">Language</label>
                        <input
                            type="text"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Accent</label>
                        <input
                            type="text"
                            value={accent}
                            onChange={(e) => setAccent(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Voice Style Tags (comma separated)</label>
                        <input
                            type="text"
                            value={selfVoiceStyle}
                            onChange={(e) => setSelfVoiceStyle(e.target.value)}
                            placeholder="e.g., warm, deep"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Upload Audio Demo</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Uploading & Analyzing...' : 'Update Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VoiceProfile;