import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins/jwt";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

// One Mongo connection per server process (survives hot reloads in development)
const g = globalThis as unknown as { __acMongo?: MongoClient };
const client = g.__acMongo ?? new MongoClient(process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017");
if (process.env.NODE_ENV !== "production") g.__acMongo = client;
const db = client.db(process.env.MONGODB_DB ?? "academiaconnect");

// The address people open the website at. BETTER_AUTH_URL wins. Vercel also tells every deployment its own addresses (without
// "https://"), so when BETTER_AUTH_URL is missing or still says localhost there, the Vercel address is used instead and login
// keeps working. Every Vercel address of this project is trusted as an origin, so the production alias, a branch address
// and the address of one particular deployment all sign in.
const onVercel = !!process.env.VERCEL && process.env.VERCEL_ENV !== "development";
const asOrigin = (host?: string) => (host ? `https://${host.replace(/^https?:\/\//, "").replace(/\/+$/, "")}` : undefined);
const vercelOrigins = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL].map(asOrigin).filter((o): o is string => !!o);
const vercelMain = process.env.VERCEL_ENV === "production" ? asOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL) : asOrigin(process.env.VERCEL_URL);
const configured = process.env.BETTER_AUTH_URL?.trim().replace(/\/+$/, "") || undefined;
const stillLocal = !!configured && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(configured);
export const siteURL = configured && !(onVercel && stillLocal) ? configured : ((onVercel && vercelMain) || "http://localhost:3000");
const baseURL = siteURL;
const admins = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function sendResetEmail(to: string, name: string, url: string) {
  if (!process.env.SMTP_HOST) {
    // No mail server configured: print the link so local development still works end to end.
    console.log(`\n[AcademiaConnect] Password reset link for ${to}:\n${url}\n`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "AcademiaConnect <no-reply@academiaconnect.test>",
    to,
    subject: "Reset your AcademiaConnect password",
    text: `Hi ${name},\n\nUse this link to choose a new password. It works for one hour:\n${url}\n\nIf you did not ask for this, you can ignore this email.`,
    html: `<p>Hi ${name},</p><p>Use this link to choose a new password. It works for one hour.</p><p><a href="${url}">Choose a new password</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
  });
}

export const auth = betterAuth({
  appName: "AcademiaConnect",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db),
  trustedOrigins: [...new Set([baseURL, ...vercelOrigins, ...(process.env.TRUSTED_ORIGINS ?? "").split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean)])],
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "student", input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: false, // after registering the student goes to the login page
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) => {
      void sendResetEmail(user.email, user.name, url).catch((e) => console.error("Reset email failed", e));
    },
  },
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { socialProviders: { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } } }
    : {}),
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  hooks: {
    // With autoSignIn off, BetterAuth answers a sign-up for a taken email with a fake "success" so nobody can probe
    // which emails exist. On a campus platform people need a plain answer, so say it before anything is created.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = String(ctx.body?.email ?? "").trim().toLowerCase();
      if (email && (await ctx.context.internalAdapter.findUserByEmail(email))?.user) {
        throw new APIError("UNPROCESSABLE_ENTITY", { message: "An account with this email already exists. Please log in instead." });
      }
    }),
  },
  session: { expiresIn: 60 * 60 * 24 * 14, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 5 * 60 } },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, role: admins.includes(user.email.toLowerCase()) ? "admin" : "student" } }),
      },
    },
  },
  plugins: [
    jwt({
      jwt: {
        expirationTime: "15m",
        definePayload: ({ user }) => ({
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          role: (user as { role?: string }).role ?? "student",
        }),
      },
    }),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
