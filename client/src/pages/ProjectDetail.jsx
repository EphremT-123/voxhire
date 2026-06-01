import Chat from '../components/Chat';
import VideoCall from '../components/VideoCall';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const [project, setProject] = useState(null);
    const [bids, setBids] = useState([]);
    const [bidAmount, setBidAmount] = useState('');
    const [bidMessage, setBidMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchProject = async () => {
        try {
            const { data } = await api.get(`/projects/${id}`);
            setProject(data);
        } catch (err) {
            setError('Project not found');
        } finally {
            setLoading(false);
        }
    };

    const fetchBids = async () => {
        try {
            const { data } = await api.get(`/projects/${id}/bids`);
            setBids(data);
        } catch (err) { /* fail silently */ }
    };

    useEffect(() => {
        fetchProject();
        fetchBids();
    }, [id]);

    const handleBid = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post(`/projects/${id}/bid`, { amount: Number(bidAmount), message: bidMessage });
            setSuccess('Bid placed!');
            setBidAmount('');
            setBidMessage('');
            fetchBids();
        } catch (err) {
            setError(err.response?.data?.message || 'Bid failed');
        }
    };

    const handleAcceptBid = async (bidId) => {
        try {
            await api.put(`/projects/${id}/accept-bid/${bidId}`);
            fetchProject();
            fetchBids();
        } catch (err) {
            setError(err.response?.data?.message || 'Accept bid failed');
        }
    };

    const handleFund = async () => {
        try {
            await api.post(`/transactions/projects/${id}/fund`);
            fetchProject();
        } catch (err) {
            setError(err.response?.data?.message || 'Funding failed');
        }
    };

    const handleDeliver = async (file) => {
        const formData = new FormData();
        formData.append('audio', file);
        try {
            await api.post(`/transactions/projects/${id}/deliver`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchProject();
        } catch (err) {
            setError(err.response?.data?.message || 'Delivery failed');
        }
    };

    const handleApprove = async () => {
        try {
            await api.put(`/transactions/projects/${id}/approve`);
            fetchProject();
        } catch (err) {
            setError(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleDispute = async () => {
        try {
            await api.put(`/transactions/projects/${id}/dispute`);
            fetchProject();
        } catch (err) {
            setError(err.response?.data?.message || 'Dispute failed');
        }
    };

    if (loading) return <div><Navbar /><p className="p-6">Loading project...</p></div>;
    if (!project) return <div><Navbar /><p className="p-6 text-red-500">{error}</p></div>;

    const isClient = user?.role === 'client' && project.client?._id === user?._id;
    const isArtist = user?.role === 'artist';
    const isAssignedArtist = isArtist && project.selectedBid?.artist === user?._id;

    return (
        <div>
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
                <p className="text-gray-600 mb-4">Status: <span className="capitalize font-semibold">{project.status.replace('_', ' ')}</span></p>
                <div className="bg-white p-4 rounded shadow mb-6">
                    <p><strong>Client:</strong> {project.client?.name}</p>
                    <p><strong>Script:</strong> {project.script}</p>
                    <p><strong>Language:</strong> {project.language} ({project.accent}) - {project.gender}</p>
                    <p><strong>Budget:</strong> ${project.budget}</p>
                    <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
                </div>

                {/* Actions based on role and status */}
                {isClient && project.status === 'open' && project.selectedBid == null && (
                    <div className="mb-6">
                        <h3 className="font-semibold">Bids ({bids.length})</h3>
                        {bids.map((bid) => (
                            <div key={bid._id} className="border p-2 rounded mb-2 flex justify-between items-center">
                                <div>
                                    <p>{bid.artist?.name} - ${bid.amount} <span className="text-sm text-gray-500">{bid.message}</span></p>
                                </div>
                                <button onClick={() => handleAcceptBid(bid._id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Accept</button>
                            </div>
                        ))}
                    </div>
                )}

                {isClient && project.status === 'in_progress' && (
                    <button onClick={handleFund} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6">Fund Project (Escrow ${project.selectedBid?.amount})</button>
                )}

                {isAssignedArtist && (project.status === 'escrow_funded' || project.status === 'in_progress') && (
                    <div className="mb-6">
                        <h3 className="font-semibold">Deliver Your Work</h3>
                        <input type="file" accept="audio/*" id="deliverFile" className="mb-2" />
                        <button onClick={() => {
                            const fileInput = document.getElementById('deliverFile');
                            if (fileInput.files[0]) handleDeliver(fileInput.files[0]);
                        }} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Upload Deliverable</button>
                    </div>
                )}

                {isClient && project.status === 'delivered' && project.delivery && (
                    <div className="mb-6">
                        <p><strong>Watermarked Preview:</strong></p>
                        <audio controls className="w-full mb-2">
                            <source src={project.delivery.watermarkedUrl} type="audio/wav" />
                        </audio>
                        <button onClick={handleApprove} className="bg-green-600 text-white px-4 py-2 rounded mr-2 hover:bg-green-700">Approve & Release Payment</button>
                        <button onClick={handleDispute} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Dispute</button>
                    </div>
                )}

                {isClient && project.status === 'completed' && project.delivery?.status === 'approved' && (
                    <div className="mb-6">
                        <p><strong>Original Audio (approved):</strong></p>
                        <audio controls className="w-full mb-2">
                            <source src={project.delivery.originalUrl} type="audio/mp4" />
                        </audio>
                    </div>
                )}

                {isArtist && project.status === 'open' && (
                    <form onSubmit={handleBid} className="bg-white p-4 rounded shadow mb-6">
                        <h3 className="font-semibold mb-3">Place a Bid</h3>
                        <input type="number" placeholder="Your bid amount" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="w-full p-2 border rounded mb-2" required />
                        <textarea placeholder="Optional message" value={bidMessage} onChange={(e) => setBidMessage(e.target.value)} className="w-full p-2 border rounded mb-2" />
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Place Bid</button>
                        {success && <p className="text-green-600 mt-2">{success}</p>}
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                    </form>
                )}

                {/* Live Session button – only when project is in progress and user is artist or client */}
                {project.status === 'in_progress' && (isClient || isAssignedArtist) && (
                    <button
                        onClick={() => window.open(`http://localhost:5000/live-video-test.html?room=${project._id}`, '_blank')}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mt-4"
                    >
                        Start Live Directed Session
                    </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Chat projectId={project._id} />
                    <VideoCall projectId={project._id} />
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;