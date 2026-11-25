import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { email } from '../src/validation';
const prisma = new PrismaClient();
async function main() {
  const target = email.parse(process.argv[2]);
  const user = await prisma.user.findUnique({ where: { email: target }, select: { id: true } });
  if (!user) throw new Error('Register the intended administrator account first');
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  console.log('Existing account promoted; sessions revoked. Sign in again.');
}
main().catch(() => { console.error('Promotion failed; check account and database configuration'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
