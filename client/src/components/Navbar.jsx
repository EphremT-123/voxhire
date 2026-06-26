import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SOCKET_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://voxhire-backend.onrender.com';

const Navbar = () => {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('voxhire-token');
        const socket = io(SOCKET_URL, {
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
        return () => socket.close();
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="bg-white border-b border-gray-200 p-3 flex justify-between items-center sticky top-0 z-40">
            <Link to="/dashboard" className="text-2xl font-extrabold text-gray-900">
                VoxHire
            </Link>

            <div className="flex items-center gap-3 text-sm">
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-semibold">
                    💎 {user.connects || 0}
                </span>

                <Link to="/feed" className="text-gray-600 font-medium hover:text-gray-900">Feed</Link>

                {user.role === 'artist' && (
                    <Link to="/my-applications" className="text-gray-600 font-medium hover:text-gray-900">My Apps</Link>
                )}

                {user.role === 'client' && (
                    <Link to="/post-job" className="bg-gray-900 text-white px-3 py-1 rounded-xl font-medium text-sm hover:bg-gray-800">+ Post Job</Link>
                )}

                <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                    <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold">
                        {user.name?.charAt(0) || '?'}
                    </span>
                </Link>

                <Link to="/chat" className="text-gray-600 hover:text-gray-900 relative">
                    <span className="text-xl">💬</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
                <Link to="/search" className="text-gray-600 font-medium hover:text-gray-900">🔍 Search</Link>
                <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-xl font-medium hover:bg-red-600">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;