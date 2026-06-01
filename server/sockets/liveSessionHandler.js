module.exports = (io) => {
    const onlineUsers = {};
    const unreadMessages = {};

    io.on('connection', (socket) => {
        console.log('✅ Socket connected:', socket.id);

        // Join chat
        socket.on('join-chat', (userId) => {
            onlineUsers[userId] = socket.id;
            socket.userId = userId;
            console.log(`💬 User ${userId} online for chat`);
            if (unreadMessages[userId]) {
                socket.emit('unread-counts', unreadMessages[userId]);
            }
        });

        // Private message
        socket.on('private-message', (data) => {
            const targetSocketId = onlineUsers[data.toUserId];
            if (!unreadMessages[data.toUserId]) unreadMessages[data.toUserId] = {};
            if (!unreadMessages[data.toUserId][data.fromUserId]) unreadMessages[data.toUserId][data.fromUserId] = 0;
            unreadMessages[data.toUserId][data.fromUserId]++;

            if (targetSocketId) {
                io.to(targetSocketId).emit('private-message', {
                    fromUserId: data.fromUserId,
                    message: data.message,
                    sender: data.sender,
                    timestamp: new Date().toISOString(),
                });
                io.to(targetSocketId).emit('unread-counts', unreadMessages[data.toUserId]);
            }
        });

        // Mark read
        socket.on('mark-read', (fromUserId) => {
            if (unreadMessages[socket.userId]?.[fromUserId]) {
                delete unreadMessages[socket.userId][fromUserId];
                socket.emit('unread-counts', unreadMessages[socket.userId] || {});
            }
        });

        // ============ VIDEO CALL SIGNALING ============
        socket.on('join-session', ({ sessionId, userId }) => {
            socket.join(sessionId);
            socket.sessionId = sessionId;
            socket.userId = userId;
            console.log(`📹 User ${userId} joined video session: ${sessionId}`);
            // Notify others in the room
            socket.to(sessionId).emit('user-joined', { userId });
            console.log(`📢 Notified others in session ${sessionId}`);
        });

        socket.on('offer', ({ sessionId, offer }) => {
            console.log(`📤 Offer from ${socket.userId} in session ${sessionId}`);
            socket.to(sessionId).emit('offer', { offer, fromUserId: socket.userId });
        });

        socket.on('answer', ({ sessionId, answer }) => {
            console.log(`📤 Answer from ${socket.userId} in session ${sessionId}`);
            socket.to(sessionId).emit('answer', { answer, fromUserId: socket.userId });
        });

        socket.on('ice-candidate', ({ sessionId, candidate }) => {
            socket.to(sessionId).emit('ice-candidate', { candidate, fromUserId: socket.userId });
        });

        socket.on('hang-up', ({ sessionId }) => {
            console.log(`🔴 Hang up in session ${sessionId}`);
            socket.to(sessionId).emit('hang-up');
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected:', socket.id);
            if (socket.userId) delete onlineUsers[socket.userId];
        });
    });
};