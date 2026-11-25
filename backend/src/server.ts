import app from './app';
import { config } from './config';
import { prisma } from './db';
const server = app.listen(config.PORT, () => console.log(`API listening on port ${config.PORT}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  server.close(() => { void prisma.$disconnect().then(() => process.exit(0)); });
  setTimeout(() => process.exit(1), 10000).unref();
});
