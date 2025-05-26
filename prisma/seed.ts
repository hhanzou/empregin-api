import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@mail.com';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('password', 10);
    await prisma.user.create({
      data: {
        name: 'admin',
        email: adminEmail,
        password: passwordHash,
        role: 'ADMIN',
      },
    });

    console.log('✔ admin criado com sucesso!');
  } else {
    console.log('ℹ admin já existe.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
