import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const checkPrisma = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

export const closePrisma = async () => {
  await prisma.$disconnect();
};
