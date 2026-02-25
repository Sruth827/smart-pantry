import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  // If we are building, don't even create the class
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null as unknown as PrismaClient;
  }
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
