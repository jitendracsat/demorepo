import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Eagerly connect on startup so Neon wakes up before the first request hits
prisma.$connect()
  .then(() => console.log('✅ Prisma connected to Neon'))
  .catch((err) => console.error('❌ Prisma initial connect failed:', err.message));

export default prisma;