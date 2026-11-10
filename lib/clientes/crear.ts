import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { esDuplicado } from "@/lib/db/errores";
import { clientes } from "@/lib/db/schema";
import type { ClienteNuevo } from "./esquemas";

const MENSAJE_DUPLICADO = "Ya hay un cliente con ese documento.";

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
