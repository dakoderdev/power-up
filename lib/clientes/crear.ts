import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientes } from "@/lib/db/schema";
import type { ClienteNuevo } from "./esquemas";

const VIOLACION_UNICA = "23505";
const MENSAJE_DUPLICADO = "Ya hay un cliente con ese documento.";

function esDuplicado(error: unknown) {
  const causa =
    error instanceof Error && "cause" in error ? error.cause : undefined;

  return [error, causa].some(
    (posible) =>
      typeof posible === "object" &&
      posible !== null &&
      "code" in posible &&
      posible.code === VIOLACION_UNICA,
  );
}

export async function crearCliente(entrada: ClienteNuevo) {
  const [existente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.documento, entrada.documento));

  if (existente) {
    return {
      creado: false as const,
      errores: { documento: [MENSAJE_DUPLICADO] },
    };
  }

  try {
    const [cliente] = await db.insert(clientes).values(entrada).returning({
      id: clientes.id,
      nombre: clientes.nombre,
      documento: clientes.documento,
    });

    return { creado: true as const, cliente };
  } catch (error) {
    if (esDuplicado(error)) {
      return {
        creado: false as const,
        errores: { documento: [MENSAJE_DUPLICADO] },
      };
    }

    throw error;
  }
}
