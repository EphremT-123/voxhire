const http = require('http');
const app = require('./app');
const socketIo = require('socket.io');
const liveSessionHandler = require('./sockets/liveSessionHandler');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new socketIo.Server(server, { cors: { origin: '*' } });

liveSessionHandler(io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});