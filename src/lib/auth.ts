import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login", // We'll create this page next
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await db.user.findUnique({
                    where: { email: credentials.email }
                });

                // Use bcrypt to compare the hashed password in the DB with the user input
                if (!user || !user.passwordHash) return null;
                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) return null;

                return { id: user.id, email: user.email, name: user.fullName };
            }
        })
    ],
};