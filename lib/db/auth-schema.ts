import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  check,
} from "drizzle-orm/sqlite-core";

export const ROLES = ["admin", "operator"] as const;

export const AHORA = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export function fecha(nombre: string) {
  return integer(nombre, { mode: "timestamp_ms" });
}

export function booleano(nombre: string) {
  return integer(nombre, { mode: "boolean" });
}

export function enLista(valores: readonly string[]) {
  return sql.raw(`(${valores.map((valor) => `'${valor}'`).join(", ")})`);
}

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: booleano("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: fecha("created_at").default(AHORA).notNull(),
    updatedAt: fecha("updated_at")
      .default(AHORA)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    username: text("username").unique(),
    displayUsername: text("display_username"),
    role: text("role", { enum: ROLES }).notNull().default("operator"),
    active: booleano("active").notNull().default(true),
  },
  (t) => [check("user_rol_valido", sql`${t.role} in ${enLista(ROLES)}`)],
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: fecha("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: fecha("created_at").default(AHORA).notNull(),
    updatedAt: fecha("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: fecha("access_token_expires_at"),
    refreshTokenExpiresAt: fecha("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: fecha("created_at").default(AHORA).notNull(),
    updatedAt: fecha("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: fecha("expires_at").notNull(),
    createdAt: fecha("created_at").default(AHORA).notNull(),
    updatedAt: fecha("updated_at")
      .default(AHORA)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
