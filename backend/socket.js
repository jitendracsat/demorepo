import { Server } from 'socket.io';

let io = null;

// In-memory Set to track sold-out items
const soldOutItems = new Set();

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
    
    // Send current stock state to newly connected client
    socket.emit('INITIAL_STOCK_STATE', Array.from(soldOutItems));
    
    // Handle stock toggle requests
    socket.on('TOGGLE_STOCK', ({ itemId, isSoldOut }) => {
      console.log('Chef toggled item:', itemId, 'Type:', typeof itemId);
      
      if (isSoldOut) {
        soldOutItems.add(itemId);
      } else {
        soldOutItems.delete(itemId);
      }
      
      // Broadcast updated stock state to all clients
      io.emit('STOCK_UPDATED', Array.from(soldOutItems));
    });
    
    socket.on('disconnect', () => {
      console.log(`🔌 KDS client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;
