import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import { clientes } from "@/lib/db/schema";

const LIMITE_BUSQUEDA = 8;

export async function buscarClientes(busqueda: string) {
  return db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      documento: clientes.documento,
    })
    .from(clientes)
    .where(
      busqueda
        ? coincideBusqueda({
            columnas: [clientes.nombre, clientes.documento],
            busqueda,
          })
        : undefined,
    )
    .orderBy(asc(clientes.nombre), asc(clientes.id))
    .limit(LIMITE_BUSQUEDA);
}

export type ClienteVenta = Awaited<ReturnType<typeof buscarClientes>>[number];
