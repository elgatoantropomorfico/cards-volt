import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  // Do NOT pin baseURL: let it derive from the request host so cookies work
  // on both cards.voltaiagents.com and the Railway temp domain.
  trustedOrigins: [
    "https://cards.voltaiagents.com",
    "https://web-production-c380e.up.railway.app",
    "http://localhost:3000",
  ],
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
