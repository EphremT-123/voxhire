import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const Navbar = () => {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('voxhire-token');
        const socketHost = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
        const socket = io(socketHost, {
            transports: ['websocket'],
            auth: { token },
        });

        socket.on('connect', () => {
            socket.emit('join-chat', user._id);
        });

        socket.on('unread-counts', (counts) => {
            const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
            setUnreadCount(total);
        });

        socket.on('private-message', (data) => {
            // Play notification sound or show toast
            console.log('New message from:', data.sender);
        });

        return () => socket.close();
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="bg-white/95 backdrop-blur shadow-lg p-3 flex justify-between items-center sticky top-0 z-40">
            <Link to="/dashboard" className="text-2xl font-extrabold bg-gradient-to-r from-amber-700 to-blue-700 bg-clip-text text-transparent">
                VoxHire
            </Link>

            <div className="flex items-center gap-3 text-sm">
                <span className="bg-gradient-to-r from-amber-100 to-blue-100 px-3 py-1 rounded-full font-semibold">
                    💎 {user.connects || 0}
                </span>

                <Link to="/feed" className="text-amber-900 font-semibold hover:text-blue-700">Feed</Link>

                {user.role === 'artist' && (
                    <Link to="/my-applications" className="text-amber-900 font-semibold hover:text-blue-700">My Apps</Link>
                )}

                {user.role === 'client' && (
                    <Link to="/post-job" className="bg-gradient-to-r from-amber-700 to-blue-700 text-white px-3 py-1 rounded-xl font-semibold">+ Post Job</Link>
                )}

                <Link to="/profile" className="text-amber-900 hover:text-blue-700" title="Profile">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {user.name?.charAt(0) || '?'}
                    </span>
                </Link>

                <Link to="/chat" className="text-amber-900 hover:text-blue-700 relative" title="Chat">
                    <span className="text-xl">💬</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
                <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-xl font-semibold hover:bg-red-600">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;