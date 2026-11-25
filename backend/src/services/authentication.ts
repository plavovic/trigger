import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { ApiError } from '../errors';
import { publicUser, dummyPasswordHash } from '../auth';
import { registerBody, loginBody } from '../validation';
export async function register(body: unknown) {
  const { password, ...data } = registerBody.parse(body);
  return prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 12) }, select: publicUser });
}
export async function login(body: unknown) {
  const data = loginBody.parse(body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const valid = await bcrypt.compare(data.password, user?.passwordHash ?? dummyPasswordHash);
  if (!user || !valid) throw new ApiError(401, 'Invalid email or password');
  const { id, email, firstName, lastName, role } = user;
  return { id, email, firstName, lastName, role };
}
