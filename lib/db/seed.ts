import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "../auth";
import { db } from "./index";
import { account, user } from "./schema";

const LARGO_MINIMO_CLAVE = 8;

function leerVariable(nombre: string) {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}.`);
  }

  return valor;
}

async function crearAdministrador() {
  const correo = leerVariable("SEED_ADMIN_EMAIL").toLowerCase();
  const clave = leerVariable("SEED_ADMIN_PASSWORD");
  const nombre = process.env.SEED_ADMIN_NAME?.trim() || "Administrador";

  if (clave.length < LARGO_MINIMO_CLAVE) {
    throw new Error(
      `SEED_ADMIN_PASSWORD necesita al menos ${LARGO_MINIMO_CLAVE} caracteres.`,
    );
  }

  const [existente] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, correo));

  if (existente) {
    console.log(`El administrador ${correo} ya existe; no se modifica.`);
    return;
  }

  const contexto = await auth.$context;
  const hash = await contexto.password.hash(clave);
  const id = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      name: nombre,
      email: correo,
      emailVerified: true,
      role: "admin",
      active: true,
    });
    await tx.insert(account).values({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: hash,
    });
  });

  console.log(`Administrador ${correo} creado.`);
}

crearAdministrador()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
