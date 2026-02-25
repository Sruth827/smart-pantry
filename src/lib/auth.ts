import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    // Standard adapter initialization for Prisma 5
    adapter: PrismaAdapter(db), 
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
	    async authorize(credentials) {
    	    	console.log("--- Login Attempt ---");
       	    	console.log("Credentials received:", credentials?.email);

            	if (!credentials?.email || !credentials?.password) {
        		console.log("Fail: Missing credentials");
        		return null;
    	    	}

    	    	const user = await db.user.findUnique({
        		where: { email: credentials.email }
            	});

    	    	if (!user) {
        		console.log("Fail: User not found in DB");
        		return null;
    	    	}

    	    	console.log("User found in DB:", user.email);
            	console.log("Hash in DB exists:", !!user.passwordHash);

            	const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
            	console.log("Bcrypt comparison result:", isValid);

            	if (!isValid) {
            		console.log("Fail: Password mismatch");
          		return null;
    	    	}

    	    	console.log("Success: Authorizing user");
    	    	return { id: user.id, email: user.email, name: user.fullName };
	    }
        })
    ],
};
