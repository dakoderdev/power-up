import { asc, count, eq } from "drizzle-orm";
import { SALDO } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import { clientes, movimientosCuenta } from "@/lib/db/schema";
import { ubicarPagina } from "@/lib/paginacion";

const LIMITE_BUSQUEDA = 8;
const CLIENTES_POR_PAGINA = 30;

function filtrar(busqueda: string) {
  return busqueda
    ? coincideBusqueda({
        columnas: [clientes.nombre, clientes.documento],
        busqueda,
      })
    : undefined;
}

export async function buscarClientes(busqueda: string) {
  return db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      documento: clientes.documento,
    })
    .from(clientes)
    .where(filtrar(busqueda))
    .orderBy(asc(clientes.nombre), asc(clientes.id))
    .limit(LIMITE_BUSQUEDA);
}

export async function listarClientes({
  busqueda,
  paginaPedida,
}: {
  busqueda: string;
  paginaPedida: number;
}) {
  const filtro = filtrar(busqueda);
  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(clientes)
    .where(filtro);
  const { pagina, paginas, desde } = ubicarPagina({
    cantidad,
    porPagina: CLIENTES_POR_PAGINA,
    pedida: paginaPedida,
  });

  const lista = await db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      documento: clientes.documento,
      telefono: clientes.telefono,
      email: clientes.email,
      saldo: SALDO,
    })
    .from(clientes)
    .leftJoin(movimientosCuenta, eq(movimientosCuenta.clienteId, clientes.id))
    .where(filtro)
    .groupBy(clientes.id)
    .orderBy(asc(clientes.nombre), asc(clientes.id))
    .limit(CLIENTES_POR_PAGINA)
    .offset(desde);

  return { lista, cantidad, pagina, paginas };
}

export type ClienteVenta = Awaited<ReturnType<typeof buscarClientes>>[number];
