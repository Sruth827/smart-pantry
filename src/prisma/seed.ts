import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("Connecting to:", process.env.DATABASE_URL);
    const passwordHash = await bcrypt.hash("pantry_pass_2026", 10);

    const user = await prisma.user.upsert({
        where: { email: "sean@test.local" }, // Using a fake email
        update: {},
        create: {
            email: "sean@test.local",
            fullName: "Sean Ruth",
            passwordHash: passwordHash,
            unitPref: "Metric", // Matches your enum default
        },
    });

    console.log("✅ Seed successful: Created/Verified user", user.email);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });