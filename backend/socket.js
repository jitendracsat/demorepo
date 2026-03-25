import { Server } from 'socket.io';

let io = null;

// TODO: DB_PERSISTENCE — Replace this in-memory Set with a Prisma query
// e.g., prisma.menuItem.findMany({ where: { isSoldOut: true } })
// The Set will not survive server restarts; a DB-backed solution is required for production.
const soldOutItems = new Set();

export const initSocket = (httpServer) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        callback(new Error(`Socket CORS: origin ${origin} not allowed`));
      },
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 KDS client connected: ${socket.id}`);

    // TODO: DB_PERSISTENCE — Replace with: const soldOutIds = await prisma.menuItem.findMany(...)
    // Send current stock state to every newly connected client
    socket.emit('INITIAL_STOCK_STATE', Array.from(soldOutItems));

    // Handle stock toggle requests from KDS
    socket.on('TOGGLE_STOCK', ({ itemId, isSoldOut }) => {
      // STRICT ID MATCHING: Always coerce to String to prevent Number vs String mismatches
      const normalizedId = String(itemId);
      console.log('Chef toggled item:', normalizedId, '(original type:', typeof itemId, ') → isSoldOut:', isSoldOut);

      // TODO: DB_PERSISTENCE — Replace with: await prisma.menuItem.update({ where: { id: normalizedId }, data: { isSoldOut } })
      if (isSoldOut) {
        soldOutItems.add(normalizedId);
      } else {
        soldOutItems.delete(normalizedId);
      }

      // Broadcast the full list of sold-out IDs to ALL connected clients (KDS + Guest menus)
      io.emit('STOCK_UPDATED', Array.from(soldOutItems));
    });

    socket.on('disconnect', () => {
      console.log(`🔌 KDS client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;
