import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.APP_URL,
    "https://cards.voltaiagents.com",
    "https://web-production-c380e.up.railway.app",
    "http://localhost:3000",
  ].filter((v): v is string => Boolean(v)),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "USER", input: false },
      companyId: { type: "string", required: false, input: false },
    },
  },
  advanced: {
    cookiePrefix: "voltcards",
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
