const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwt');

let io = null;

function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // JWT authentication for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyToken(token);
      if (decoded.twoFactorPending) return next(new Error('2FA not completed'));
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join role-based room and user-specific room
    socket.join(socket.user.role);
    socket.join(`user-${socket.user.userId}`);

    socket.on('disconnect', () => {
      // cleanup handled automatically by socket.io
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

// Safe emit — won't throw if io not initialized (e.g. in tests)
function emit(room, event, data) {
  try {
    getIO().to(room).emit(event, data);
  } catch {
    // non-fatal
  }
}

module.exports = { initializeWebSocket, getIO, emit };
