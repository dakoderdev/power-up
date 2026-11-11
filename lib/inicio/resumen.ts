import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientes,
  itemsVenta,
  movimientosCuenta,
  productos,
  ventas,
} from "@/lib/db/schema";
import { inicioDelDia } from "@/lib/fechas";
import { aCentavos, deCentavos } from "@/lib/moneda";

const LIMITE_LISTA = 5;
const LIMITE_VENTAS = 15;
const UMBRAL_STOCK_BAJO = 3;

const SALDO =
  sql<string>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'venta' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`.mapWith(
    movimientosCuenta.importe,
  );

async function obtenerItemsDeVentas(ventaIds: number[]) {
  if (ventaIds.length === 0) {
    return [];
  }

  return db
    .select({
      ventaId: itemsVenta.ventaId,
      descripcion: itemsVenta.descripcion,
      cantidad: itemsVenta.cantidad,
      imagenUrl: productos.imagenUrl,
    })
    .from(itemsVenta)
    .innerJoin(productos, eq(productos.id, itemsVenta.productoId))
    .where(inArray(itemsVenta.ventaId, ventaIds))
    .orderBy(asc(itemsVenta.id));
}

async function obtenerVentasDeHoy() {
  const desdeHoy = gte(ventas.creadoEn, inicioDelDia(new Date()));

  const [totales, ultimas] = await Promise.all([
    db
      .select({
        formaPago: ventas.formaPago,
        cantidad: count(),
        importe: sum(ventas.total).mapWith(ventas.total),
      })
      .from(ventas)
      .where(desdeHoy)
      .groupBy(ventas.formaPago)
      .orderBy(ventas.formaPago),
    db
      .select({
        id: ventas.id,
        numero: ventas.numero,
        creadoEn: ventas.creadoEn,
        clienteNombre: ventas.clienteNombre,
        formaPago: ventas.formaPago,
        total: ventas.total,
      })
      .from(ventas)
      .where(desdeHoy)
      .orderBy(desc(ventas.numero))
      .limit(LIMITE_VENTAS),
  ]);

  const items = await obtenerItemsDeVentas(ultimas.map((venta) => venta.id));
  const ultimasConItems = ultimas.map((venta) => ({
    ...venta,
    items: items.filter((item) => item.ventaId === venta.id),
  }));

  const porFormaPago = totales.map((fila) => ({
    formaPago: fila.formaPago,
    importe: fila.importe ?? "0",
  }));
  const centavos = porFormaPago.reduce(
    (acumulado, fila) => acumulado + aCentavos(fila.importe),
    0,
  );

  return {
    cantidad: totales.reduce((suma, fila) => suma + fila.cantidad, 0),
    total: deCentavos(centavos),
    porFormaPago,
    ultimas: ultimasConItems,
  };
}

async function obtenerCuentasPorCobrar() {
  const [[{ saldo: total }], deudores] = await Promise.all([
    db.select({ saldo: SALDO }).from(movimientosCuenta),
    db
      .select({
        id: clientes.id,
        nombre: clientes.nombre,
        saldo: SALDO,
        cantidad: sql<number>`count(*) over()`.mapWith(Number),
      })
      .from(clientes)
      .innerJoin(
        movimientosCuenta,
        eq(movimientosCuenta.clienteId, clientes.id),
      )
      .groupBy(clientes.id)
      .having(sql`${SALDO} > 0`)
      .orderBy(desc(SALDO))
      .limit(LIMITE_LISTA),
  ]);

  return { total, deudores, cantidad: deudores[0]?.cantidad ?? 0 };
}

async function obtenerProductosStockBajo() {
  const stockBajo = and(
    eq(productos.activo, true),
    lte(productos.stock, UMBRAL_STOCK_BAJO),
  );

  const [[{ cantidad }], lista] = await Promise.all([
    db.select({ cantidad: count() }).from(productos).where(stockBajo),
    db
      .select({
        id: productos.id,
        nombre: productos.nombre,
        stock: productos.stock,
        imagenUrl: productos.imagenUrl,
      })
      .from(productos)
      .where(stockBajo)
      .orderBy(asc(productos.stock), asc(productos.nombre))
      .limit(LIMITE_LISTA),
  ]);

  return { cantidad, lista };
}

export async function obtenerResumenInicio() {
  const [ventasHoy, cuentas, stockBajo] = await Promise.all([
    obtenerVentasDeHoy(),
    obtenerCuentasPorCobrar(),
    obtenerProductosStockBajo(),
  ]);

  return { ventasHoy, cuentas, stockBajo };
}
