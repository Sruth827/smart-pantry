import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query"], // This helps you see what's happening in the console
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;