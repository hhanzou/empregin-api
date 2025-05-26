import { Request, Response } from 'express';
import { prisma } from '@lib/prisma';

export async function listUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({ where: { deletedAt: null } });
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  const user = await prisma.user.create({ data: { name, email, password, role } });
  res.status(201).json(user);
}

export async function softDeleteUser(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.user.update({
    where: { id: Number(id) },
    data: { deletedAt: new Date() },
  });
  res.status(204).send();
}
