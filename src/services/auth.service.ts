import bcrypt from 'bcryptjs';

import { prisma } from '@lib/prisma';
import { generateToken } from '@utils/jwt';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({ userId: user.id, role: user.role });
  return { token, user };
}

export async function register(name: string, email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hash },
  });

  const token = generateToken({ userId: user.id, role: user.role });
  return { token, user };
}
