import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import VideoCall from '../components/VideoCall';

const SOCKET_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://voxhire-backend.onrender.com';

const Chat = () => {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState({});
    const [input, setInput] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({});
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('voxhire-token');
        if (!token || !user) return;

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            auth: { token },
        });

        newSocket.on('connect', () => {
            console.log('Chat connected');
            newSocket.emit('join-chat', user._id);
        });

        newSocket.on('private-message', (data) => {
            const otherUser = data.fromUserId === user._id ? data.toUserId : data.fromUserId;
            setMessages(prev => ({
                ...prev,
                [otherUser]: [...(prev[otherUser] || []), data]
            }));
            if (data.fromUserId !== user._id) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.fromUserId]: (prev[data.fromUserId] || 0) + 1
                }));
            }
        });

        newSocket.on('unread-counts', (counts) => {
            setUnreadCounts(counts || {});
        });

        setSocket(newSocket);
        return () => newSocket.close();
    }, [user]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const { data } = await api.get('/users/search?q=');
                setUsers(data.filter(u => u._id !== user._id));
            } catch (err) {
                console.error('Failed to load users:', err);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedUser]);

    const selectUser = (u) => {
        setSelectedUser(u);
        if (socket) {
            socket.emit('mark-read', u._id);
            setUnreadCounts(prev => {
                const newCounts = { ...prev };
                delete newCounts[u._id];
                return newCounts;
            });
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket || !selectedUser) return;
        const msgData = {
            toUserId: selectedUser._id,
            message: input.trim(),
            sender: user.name,
            fromUserId: user._id,
            timestamp: new Date().toISOString(),
        };
        socket.emit('private-message', msgData);
        setMessages(prev => ({
            ...prev,
            [selectedUser._id]: [...(prev[selectedUser._id] || []), { ...msgData, sent: true }]
        }));
        setInput('');
    };

    const getLastMessage = (userId) => {
        const userMessages = messages[userId] || [];
        return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
    };

    const sortedUsers = [...users].sort((a, b) => {
        const aUnread = unreadCounts[a._id] || 0;
        const bUnread = unreadCounts[b._id] || 0;
        if (aUnread > 0 && bUnread === 0) return -1;
        if (bUnread > 0 && aUnread === 0) return 1;
        const aLastMsg = getLastMessage(a._id);
        const bLastMsg = getLastMessage(b._id);
        if (aLastMsg && bLastMsg) return new Date(bLastMsg.timestamp) - new Date(aLastMsg.timestamp);
        if (aLastMsg) return -1;
        if (bLastMsg) return 1;
        return 0;
    });

    const currentMessages = selectedUser ? (messages[selectedUser._id] || []) : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-blue-900">
            <Navbar />
            <div className="max-w-5xl mx-auto p-4 md:p-6">
                <div className="bg-white/95 rounded-2xl shadow-2xl overflow-hidden" style={{ height: '75vh' }}>
                    <div className="flex h-full">
                        <div className="w-72 border-r border-gray-200 flex flex-col flex-shrink-0">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="font-bold text-amber-900">💬 Messages</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {sortedUsers.map(u => {
                                    const unread = unreadCounts[u._id] || 0;
                                    const lastMsg = getLastMessage(u._id);
                                    return (
                                        <div key={u._id} onClick={() => selectUser(u)}
                                            className={`p-3 cursor-pointer hover:bg-amber-50 transition flex items-center gap-3 border-b ${selectedUser?._id === u._id ? 'bg-amber-100 border-l-4 border-amber-600' : ''} ${unread > 0 ? 'bg-blue-50' : ''}`}>
                                            <div className="relative flex-shrink-0">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {u.name?.charAt(0) || '?'}
                                                </div>
                                                {unread > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                                        {unread > 9 ? '9+' : unread}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-amber-900' : 'font-semibold text-amber-900'}`}>{u.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{lastMsg ? lastMsg.message : u.role}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                            {selectedUser ? (
                                <>
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                                {selectedUser.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-amber-900">{selectedUser.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{selectedUser.role}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowVideoCall(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
                                            📹 Video Call
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                        {currentMessages.map((msg, i) => {
                                            const isMine = msg.fromUserId === user._id || msg.sent;
                                            return (
                                                <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isMine ? 'bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border'}`}>
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className="text-xs opacity-60 mt-1 text-right">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 flex gap-2 bg-white">
                                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                            placeholder="Type a message..." className="flex-1 p-3 border-2 border-gray-200 rounded-xl" />
                                        <button type="submit" className="bg-gradient-to-r from-amber-700 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold">Send</button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                                    <div className="text-center"><div className="text-6xl mb-4">💬</div><p>Select a conversation</p></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showVideoCall && selectedUser && (
                <VideoCall sessionId={[user._id, selectedUser._id].sort().join('-')} userId={user._id} userName={user.name} onClose={() => setShowVideoCall(false)} />
            )}
        </div>
    );
};

export default Chat;