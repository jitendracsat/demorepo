import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 KDS client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`🔌 KDS client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;
