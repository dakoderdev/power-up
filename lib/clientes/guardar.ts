import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { esDuplicado } from "@/lib/db/errores";
import { clientes } from "@/lib/db/schema";
import type { ClienteNuevo } from "./esquemas";

const MENSAJE_DUPLICADO = "Ya hay un cliente con ese documento.";

export type ErroresCliente = Partial<Record<keyof ClienteNuevo, string[]>>;

const DOCUMENTO_DUPLICADO = {
  errores: { documento: [MENSAJE_DUPLICADO] } as ErroresCliente,
};

async function documentoEnUso({
  documento,
  exceptoId,
}: {
  documento: string;
  exceptoId?: number;
}) {
  const [existente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(
      and(
        eq(clientes.documento, documento),
        exceptoId === undefined ? undefined : ne(clientes.id, exceptoId),
      ),
    );

  return Boolean(existente);
}

export async function crearCliente(entrada: ClienteNuevo) {
  if (await documentoEnUso({ documento: entrada.documento })) {
    return { creado: false as const, ...DOCUMENTO_DUPLICADO };
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
      return { creado: false as const, ...DOCUMENTO_DUPLICADO };
    }

    throw error;
  }
}

export type ResultadoEditar =
  | { guardado: true }
  | { guardado: false; errores: ErroresCliente; mensaje?: string };

export async function editarCliente({
  id,
  entrada,
}: {
  id: number;
  entrada: ClienteNuevo;
}): Promise<ResultadoEditar> {
  if (await documentoEnUso({ documento: entrada.documento, exceptoId: id })) {
    return { guardado: false, ...DOCUMENTO_DUPLICADO };
  }

  try {
    const [cliente] = await db
      .update(clientes)
      .set(entrada)
      .where(eq(clientes.id, id))
      .returning({ id: clientes.id });

    return cliente
      ? { guardado: true }
      : {
          guardado: false,
          errores: {},
          mensaje: "El cliente ya no existe. Volvé al listado y elegí otro.",
        };
  } catch (error) {
    if (esDuplicado(error)) {
      return { guardado: false, ...DOCUMENTO_DUPLICADO };
    }

    throw error;
  }
}
