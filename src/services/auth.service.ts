import bcrypt from "bcryptjs";

import { prisma } from "@lib/prisma";
import { generateToken } from "@lib/jwt";
import { Role } from "@prisma/client";
import { LoginResponse } from "@controllers/auth.controller";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    !(await bcrypt.compare(password, user.password)) ||
    user.deletedAt
  ) {
    throw new Error("Invalid credentials");
  }

  const { password: _, ...safeUser } = user;

  const token = generateToken({ userId: user.id, role: user.role });
  return { token, user: safeUser };
}

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

// TODO: criar validações de entrada

export async function register(data: RegisterPayload): Promise<LoginResponse> {
  const hash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hash,
    },
  });

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  const { password, ...safeUser } = user;
  return { token, user: safeUser };
}
