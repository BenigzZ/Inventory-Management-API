import { env } from './config/env'; // <--- NAMED IMPORT
import { prisma } from './config/prisma'; // <--- NAMED IMPORT
import { app } from './app'; // <--- NAMED IMPORT

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📍 Health check: http://localhost:${env.PORT}/health`);
      console.log(`📚 API base: http://localhost:${env.PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start();