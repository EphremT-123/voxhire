import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import VideoCall from '../components/VideoCall';

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

    // Connect to Socket.io
    useEffect(() => {
        const token = localStorage.getItem('voxhire-token');
        if (!token || !user) return;

        const socketHost = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
        const newSocket = io(socketHost, {
            transports: ['websocket'],
            auth: { token },
        });

        newSocket.on('connect', () => {
            console.log('Chat connected');
            newSocket.emit('join-chat', user._id);
        });

        newSocket.on('private-message', (data) => {
            console.log('Message received:', data);
            const otherUser = data.fromUserId === user._id ? data.toUserId : data.fromUserId;

            // Add message to the conversation
            setMessages(prev => ({
                ...prev,
                [otherUser]: [...(prev[otherUser] || []), data]
            }));

            // Increment unread count if message is from someone else
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

    // Load users
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

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedUser]);

    const selectUser = (u) => {
        setSelectedUser(u);
        // Mark messages as read
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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    };

    // Get last message for each user
    const getLastMessage = (userId) => {
        const userMessages = messages[userId] || [];
        return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
    };

    // Sort users: those with unread messages first, then by last message time
    const sortedUsers = [...users].sort((a, b) => {
        const aUnread = unreadCounts[a._id] || 0;
        const bUnread = unreadCounts[b._id] || 0;

        // Unread messages come first
        if (aUnread > 0 && bUnread === 0) return -1;
        if (bUnread > 0 && aUnread === 0) return 1;

        // Then sort by most recent message
        const aLastMsg = getLastMessage(a._id);
        const bLastMsg = getLastMessage(b._id);

        if (aLastMsg && bLastMsg) {
            return new Date(bLastMsg.timestamp) - new Date(aLastMsg.timestamp);
        }
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
                        {/* Users Sidebar */}
                        <div className="w-72 border-r border-gray-200 flex flex-col flex-shrink-0">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="font-bold text-amber-900">💬 Messages</h2>
                                <p className="text-xs text-gray-500 mt-1">{users.length} contacts</p>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {sortedUsers.length === 0 ? (
                                    <p className="text-gray-500 text-sm p-4">No contacts available</p>
                                ) : (
                                    sortedUsers.map(u => {
                                        const unread = unreadCounts[u._id] || 0;
                                        const lastMsg = getLastMessage(u._id);
                                        return (
                                            <div
                                                key={u._id}
                                                onClick={() => selectUser(u)}
                                                className={`p-3 cursor-pointer hover:bg-amber-50 transition flex items-center gap-3 border-b border-gray-50 ${selectedUser?._id === u._id ? 'bg-amber-100 border-l-4 border-amber-600' : ''
                                                    } ${unread > 0 ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-11 h-11 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                                        {u.name?.charAt(0) || '?'}
                                                    </div>
                                                    {unread > 0 && (
                                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                                                            {unread > 9 ? '9+' : unread}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-amber-900' : 'font-semibold text-amber-900'}`}>
                                                            {u.name}
                                                        </p>
                                                        {lastMsg && (
                                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                                                                {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs truncate ${unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                        {lastMsg ? lastMsg.message : u.role}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {selectedUser ? (
                                <>
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                                    {selectedUser.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-amber-900">{selectedUser.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{selectedUser.role}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowVideoCall(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                                        >
                                            📹 Video Call
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                        {currentMessages.length === 0 && (
                                            <div className="text-center mt-20">
                                                <div className="text-6xl mb-4">👋</div>
                                                <p className="text-gray-400">Start the conversation!</p>
                                            </div>
                                        )}
                                        {currentMessages.map((msg, i) => {
                                            const isMine = msg.fromUserId === user._id || msg.sent;
                                            return (
                                                <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${isMine
                                                        ? 'bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-br-md'
                                                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                                                        }`}>
                                                        {!isMine && (
                                                            <p className="text-xs font-semibold text-amber-700 mb-1">{msg.sender || selectedUser.name}</p>
                                                        )}
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
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Type a message..."
                                            className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none text-sm"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim()}
                                            className="bg-gradient-to-r from-amber-700 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">💬</div>
                                        <p className="text-lg font-medium text-gray-500">Select a conversation</p>
                                        <p className="text-sm text-gray-400 mt-1">Choose a contact to start chatting</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Call Modal */}
            {showVideoCall && selectedUser && (
                <VideoCall
                    sessionId={[user._id, selectedUser._id].sort().join('-')}
                    userId={user._id}
                    userName={user.name}
                    onClose={() => setShowVideoCall(false)}
                />
            )}
        </div>
    );
};

export default Chat;