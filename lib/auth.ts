import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      role: {
        type: [...schema.ROLES],
        defaultValue: "operator",
        input: false,
      },
      active: { type: "boolean", defaultValue: true, input: false },
    },
  },
  plugins: [username(), nextCookies()],
  databaseHooks: {
    session: {
      create: {
        before: async (sesion) => {
          const [usuario] = await db
            .select({ active: schema.user.active })
            .from(schema.user)
            .where(eq(schema.user.id, sesion.userId));
          if (!usuario?.active) {
            throw new APIError("FORBIDDEN", { message: "Usuario inactivo" });
          }
          return { data: sesion };
        },
      },
    },
  },
});
