import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const Jobs = () => {
    const user = useAuthStore((s) => s.user);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await api.get('/jobs');
                setJobs(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const handleApply = async (jobId) => {
        try {
            await api.post(`/jobs/${jobId}/apply`, { coverLetter: 'I would love to work on this project!' });
            alert('Applied successfully! 10 connects spent.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to apply');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-blue-900">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Available Jobs</h1>
                    {user?.role === 'client' && (
                        <button
                            onClick={() => navigate('/post-job')}
                            className="bg-white text-amber-900 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
                        >
                            ➕ Post New Job
                        </button>
                    )}
                </div>

                {loading ? (
                    <p className="text-white">Loading...</p>
                ) : (
                    <div className="space-y-4">
                        {jobs.map(job => (
                            <div key={job._id} className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-xl">
                                <h3 className="text-xl font-bold text-amber-900">{job.title}</h3>
                                <p className="text-gray-600 mt-1">{job.description}</p>
                                <div className="flex gap-4 mt-3 text-sm">
                                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">💰 ${job.budget}</span>
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">⏰ {job.deadline}</span>
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">👔 {job.clientName}</span>
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">⚡ {job.urgency}</span>
                                </div>

                                {/* Artist Apply Button */}
                                {user?.role === 'artist' && job.status === 'open' && (
                                    <button
                                        onClick={() => handleApply(job._id)}
                                        className="mt-4 bg-gradient-to-r from-amber-700 to-blue-700 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition"
                                    >
                                        🎯 Apply Now (10 connects)
                                    </button>
                                )}

                                {/* Client View Applications Button */}
                                {user?.role === 'client' && job.client?._id === user._id && (
                                    <button
                                        onClick={() => navigate(`/applications/${job._id}`)}
                                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition ml-3"
                                    >
                                        📋 View Applications
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Jobs;