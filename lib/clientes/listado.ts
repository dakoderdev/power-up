import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { SALDO } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import { clientes, movimientosCuenta } from "@/lib/db/schema";
import { ubicarPagina } from "@/lib/paginacion";

const LIMITE_BUSQUEDA = 8;
const CLIENTES_POR_PAGINA = 30;

export const ORDENES_CLIENTES = ["nombre", "saldo"] as const;

export type OrdenClientes = (typeof ORDENES_CLIENTES)[number];

function filtrar(busqueda: string) {
  return busqueda
    ? coincideBusqueda({
        columnas: [clientes.nombre, clientes.documento],
        busqueda,
      })
    : undefined;
}

// RF-V2, CL-05 y RF-C7: búsqueda rápida para la venta; un cliente dado de baja no aparece.
export async function buscarClientes(busqueda: string) {
  return db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      documento: clientes.documento,
    })
    .from(clientes)
    .where(and(eq(clientes.activo, true), filtrar(busqueda)))
    .orderBy(asc(clientes.nombre), asc(clientes.id))
    .limit(LIMITE_BUSQUEDA);
}

// RF-C1 y RF-C6: listado con el saldo de cada cliente; con conDeuda, solo
// los que deben, con el total adeudado.
export async function listarClientes({
  busqueda,
  paginaPedida,
  porPagina = CLIENTES_POR_PAGINA,
  conDeuda = false,
  orden = "nombre",
}: {
  busqueda: string;
  paginaPedida: number;
  porPagina?: number;
  conDeuda?: boolean;
  orden?: OrdenClientes;
}) {
  const saldos = db
    .select({ id: clientes.id, saldo: SALDO.as("saldo") })
    .from(clientes)
    .leftJoin(movimientosCuenta, eq(movimientosCuenta.clienteId, clientes.id))
    .where(filtrar(busqueda))
    .groupBy(clientes.id)
    .having(conDeuda ? sql`${SALDO} > 0` : undefined)
    .as("saldos");

  const saldo = sql<string>`${saldos.saldo}`.mapWith(movimientosCuenta.importe);

  const [{ cantidad, totalAdeudado }] = await db
    .select({
      cantidad: count(),
      totalAdeudado: sql<string>`coalesce(sum(${saldos.saldo}), 0)`.mapWith(
        movimientosCuenta.importe,
      ),
    })
    .from(saldos);

  const { pagina, paginas, desde } = ubicarPagina({
    cantidad,
    porPagina,
    pedida: paginaPedida,
  });

  const lista = await db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      documento: clientes.documento,
      telefono: clientes.telefono,
      email: clientes.email,
      limiteCredito: clientes.limiteCredito,
      activo: clientes.activo,
      creadoEn: clientes.creadoEn,
      saldo,
    })
    .from(clientes)
    .innerJoin(saldos, eq(saldos.id, clientes.id))
    .orderBy(
      ...(orden === "saldo" ? [desc(saldo)] : []),
      asc(clientes.nombre),
      asc(clientes.id),
    )
    .limit(porPagina)
    .offset(desde);

  return { lista, cantidad, totalAdeudado, pagina, paginas };
}

export type ClienteVenta = Awaited<ReturnType<typeof buscarClientes>>[number];
export type ClienteFilaSaldo = Awaited<
  ReturnType<typeof listarClientes>
>["lista"][number];
