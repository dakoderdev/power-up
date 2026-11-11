import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const cliente = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(cliente, { schema });

export type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Consulta = typeof db | Transaccion;
