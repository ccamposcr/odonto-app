import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Socket is initializing');
  const io = new Server(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ['GET', 'POST'],
      credentials: false
    },
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    pingTimeout: 30000,
    pingInterval: 10000,
    upgradeTimeout: 10000,
    httpCompression: true,
    perMessageDeflate: true
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id, 'Transport:', socket.conn.transport.name);

    // Log transport upgrades
    socket.conn.on('upgrade', () => {
      console.log('⬆️ Client', socket.id, 'upgraded to:', socket.conn.transport.name);
    });

    // El cliente se une a las salas relevantes
    socket.join('citas-room');
    socket.join('expedientes-room');
    socket.join('config-room');

    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    socket.on('leave-room', (room) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  res.end();
};

export default SocketHandler;