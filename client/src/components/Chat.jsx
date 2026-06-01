import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import useAuthStore from '../store/authStore';

const Chat = ({ projectId }) => {
    const socket = useSocket();
    const user = useAuthStore((s) => s.user);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join-chat', projectId);

        const handleMessage = (data) => {
            setMessages((prev) => [...prev, data]);
        };

        socket.on('chat-message', handleMessage);

        return () => {
            socket.off('chat-message', handleMessage);
        };
    }, [socket, projectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket) return;

        const msgData = {
            projectId,
            message: input.trim(),
            sender: user.name || user.email,
        };

        socket.emit('chat-message', msgData);
        setMessages((prev) => [...prev, { ...msgData, timestamp: new Date() }]);
        setInput('');
    };

    return (
        <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Project Chat</h3>
            <div className="h-40 overflow-y-auto mb-2 border p-2 rounded">
                {messages.map((msg, idx) => (
                    <div key={idx} className="mb-1">
                        <span className="font-medium text-sm">{msg.sender}: </span>
                        <span className="text-sm">{msg.message}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 border rounded p-1 text-sm"
                    placeholder="Type a message..."
                />
                <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Send</button>
            </form>
        </div>
    );
};

export default Chat;