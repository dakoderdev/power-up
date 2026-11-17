import { and, asc, count, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { SALDO } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";
import {
  FORMAS_PAGO,
  itemsVenta,
  movimientosCuenta,
  productos,
  ventas,
} from "@/lib/db/schema";
import { claveDia, inicioDelDia } from "@/lib/fechas";
import { aCentavos, deCentavos } from "@/lib/moneda";
import { DIA } from "@/lib/ventas/listado";

const DIAS_GRAFICO = 30;
const LIMITE_MAS_VENDIDOS = 5;
const MS_POR_DIA = 86_400_000;
const MEDIODIA_UTC = "T12:00:00Z";

function inicioDelMes(ahora: Date) {
  const mes = claveDia(ahora).slice(0, 7);

  return inicioDelDia(new Date(`${mes}-01${MEDIODIA_UTC}`));
}

function soloEmitidasDesde(desde: Date) {
  return and(gte(ventas.creadoEn, desde), isNull(ventas.anuladaEn));
}

async function totalesDesde(desde: Date) {
  const [fila] = await db
    .select({
      cantidad: count(),
      importe: sum(ventas.total).mapWith(ventas.total),
    })
    .from(ventas)
    .where(soloEmitidasDesde(desde));

  return { cantidad: fila.cantidad, importe: fila.importe ?? deCentavos(0) };
}

async function obtenerVentasDiarias(inicioHoy: Date) {
  const inicio = new Date(
    inicioHoy.getTime() - (DIAS_GRAFICO - 1) * MS_POR_DIA,
  );
  const filas = await db
    .select({ dia: DIA, importe: sum(ventas.total).mapWith(ventas.total) })
    .from(ventas)
    .where(soloEmitidasDesde(inicio))
    .groupBy(DIA);

  return Array.from({ length: DIAS_GRAFICO }, (_, indice) => {
    const fecha = claveDia(
      new Date(inicio.getTime() + indice * MS_POR_DIA + MS_POR_DIA / 2),
    );

    return {
      fecha,
      importe:
        filas.find((fila) => fila.dia === fecha)?.importe ?? deCentavos(0),
    };
  });
}

async function obtenerPorFormaDePago(inicioMes: Date) {
  const filas = await db
    .select({
      forma: ventas.formaPago,
      importe: sum(ventas.total).mapWith(ventas.total),
    })
    .from(ventas)
    .where(soloEmitidasDesde(inicioMes))
    .groupBy(ventas.formaPago);

  return FORMAS_PAGO.map((forma) => ({
    forma,
    importe:
      filas.find((fila) => fila.forma === forma)?.importe ?? deCentavos(0),
  }));
}

async function obtenerMasVendidos(inicioMes: Date) {
  const unidades = sum(itemsVenta.cantidad).mapWith(Number);

  return db
    .select({
      productoId: itemsVenta.productoId,
      codigo: productos.codigo,
      descripcion: productos.nombre,
      unidades,
      importe: sum(itemsVenta.subtotal).mapWith(itemsVenta.subtotal),
    })
    .from(itemsVenta)
    .innerJoin(ventas, eq(ventas.id, itemsVenta.ventaId))
    .innerJoin(productos, eq(productos.id, itemsVenta.productoId))
    .where(soloEmitidasDesde(inicioMes))
    .groupBy(itemsVenta.productoId, productos.codigo, productos.nombre)
    .orderBy(desc(unidades), asc(productos.nombre))
    .limit(LIMITE_MAS_VENDIDOS);
}

async function obtenerCuentasCorrientes() {
  const deudores = db
    .select({ clienteId: movimientosCuenta.clienteId })
    .from(movimientosCuenta)
    .groupBy(movimientosCuenta.clienteId)
    .having(sql`${SALDO} > 0`)
    .as("deudores");

  const [[{ totalAdeudado }], [{ clientesConSaldo }]] = await Promise.all([
    db.select({ totalAdeudado: SALDO }).from(movimientosCuenta),
    db.select({ clientesConSaldo: count() }).from(deudores),
  ]);

  return { totalAdeudado, clientesConSaldo };
}

async function contarBajoMinimo() {
  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(productos)
    .where(
      and(
        eq(productos.activo, true),
        sql`${productos.stock} <= ${productos.stockMinimo}`,
      ),
    );

  return cantidad;
}

// RF-T1, RF-T2 y RF-T3: indicadores del día y del mes, deuda total, productos
// bajo el mínimo, ventas diarias de 30 días, ventas del mes por forma de pago
// y los 5 más vendidos; solo facturas emitidas, en hora de Argentina.
export async function obtenerTablero(ahora = new Date()) {
  const inicioHoy = inicioDelDia(ahora);
  const inicioMes = inicioDelMes(ahora);

  const [
    hoy,
    mes,
    cuentasCorrientes,
    bajoMinimo,
    ventasDiarias,
    porFormaDePago,
    masVendidos,
  ] = await Promise.all([
    totalesDesde(inicioHoy),
    totalesDesde(inicioMes),
    obtenerCuentasCorrientes(),
    contarBajoMinimo(),
    obtenerVentasDiarias(inicioHoy),
    obtenerPorFormaDePago(inicioMes),
    obtenerMasVendidos(inicioMes),
  ]);

  const ticketPromedio =
    mes.cantidad === 0
      ? deCentavos(0)
      : deCentavos(Math.round(aCentavos(mes.importe) / mes.cantidad));

  return {
    hoy,
    mes: { ...mes, ticketPromedio },
    cuentasCorrientes,
    bajoMinimo: { cantidad: bajoMinimo },
    ventasDiarias,
    porFormaDePago,
    masVendidos,
  };
}

export type Tablero = Awaited<ReturnType<typeof obtenerTablero>>;
