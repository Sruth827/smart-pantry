import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;          
      isFirstLogin: boolean; 
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    role: string;
    isFirstLogin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;          
    isFirstLogin: boolean; 
  }
}