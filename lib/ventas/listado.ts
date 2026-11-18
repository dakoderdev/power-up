import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
  sum,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import {
  FORMAS_PAGO,
  itemsVenta,
  productos,
  user,
  ventas,
} from "@/lib/db/schema";
import { claveDia, DESFASE_HORAS } from "@/lib/fechas";
import { deCentavos } from "@/lib/moneda";
import { ubicarPagina } from "@/lib/paginacion";

const VENTAS_POR_PAGINA = 30;
const SOLO_DIGITOS = /^\d+$/;

export const DIA = sql<string>`strftime('%Y-%m-%d', ${ventas.creadoEn} / 1000, 'unixepoch', ${sql.raw(`'${DESFASE_HORAS} hours'`)})`;

export const ESTADOS_VENTA = ["emitida", "anulada"] as const;

export type EstadoVenta = (typeof ESTADOS_VENTA)[number];

export type FiltrosListado = {
  busqueda?: string;
  desde?: Date;
  hasta?: Date;
  clienteId?: number;
  vendedorId?: string;
  formaPago?: (typeof FORMAS_PAGO)[number];
  estado?: EstadoVenta;
};

function filtroNumero(busqueda: string) {
  const parte = busqueda.includes("-")
    ? busqueda.slice(busqueda.lastIndexOf("-") + 1)
    : busqueda;
  const numero = Number(parte);

  return SOLO_DIGITOS.test(parte) && Number.isSafeInteger(numero)
    ? eq(ventas.numero, numero)
    : undefined;
}

function armarFiltro({
  busqueda,
  desde,
  hasta,
  clienteId,
  vendedorId,
  formaPago,
  estado,
}: FiltrosListado) {
  return and(
    busqueda
      ? or(
          coincideBusqueda({ columnas: [ventas.clienteNombre], busqueda }),
          filtroNumero(busqueda),
        )
      : undefined,
    desde ? gte(ventas.creadoEn, desde) : undefined,
    hasta ? lt(ventas.creadoEn, hasta) : undefined,
    clienteId ? eq(ventas.clienteId, clienteId) : undefined,
    vendedorId ? eq(ventas.usuarioId, vendedorId) : undefined,
    formaPago ? eq(ventas.formaPago, formaPago) : undefined,
    estado === "emitida" ? isNull(ventas.anuladaEn) : undefined,
    estado === "anulada" ? isNotNull(ventas.anuladaEn) : undefined,
  );
}

async function resumirFiltro(filtro: SQL | undefined) {
  const [[{ cantidad }], [{ totalEmitido }]] = await Promise.all([
    db.select({ cantidad: count() }).from(ventas).where(filtro),
    db
      .select({ totalEmitido: sum(ventas.total).mapWith(ventas.total) })
      .from(ventas)
      .where(and(filtro, isNull(ventas.anuladaEn))),
  ]);

  return { cantidad, totalEmitido: totalEmitido ?? deCentavos(0) };
}

// RF-V8: facturas con filtros por fecha, cliente, forma de pago, vendedor,
// estado y número, de la más nueva a la más vieja, con el total emitido.
export async function buscarVentas({
  busqueda,
  desde,
  hasta,
  clienteId,
  vendedorId,
  formaPago,
  estado,
  paginaPedida,
  porPagina = VENTAS_POR_PAGINA,
}: FiltrosListado & {
  busqueda: string;
  paginaPedida: number;
  porPagina?: number;
}) {
  const filtro = armarFiltro({
    busqueda,
    desde,
    hasta,
    clienteId,
    vendedorId,
    formaPago,
    estado,
  });

  const { cantidad, totalEmitido } = await resumirFiltro(filtro);

  const {
    pagina,
    paginas,
    desde: salto,
  } = ubicarPagina({ cantidad, porPagina, pedida: paginaPedida });

  const lista = await db
    .select({
      id: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numero: ventas.numero,
      creadoEn: ventas.creadoEn,
      clienteId: ventas.clienteId,
      clienteNombre: ventas.clienteNombre,
      clienteTipoDoc: ventas.clienteTipoDoc,
      clienteDocumento: ventas.clienteDocumento,
      formaPago: ventas.formaPago,
      total: ventas.total,
      anuladaEn: ventas.anuladaEn,
      vendedorId: ventas.usuarioId,
      vendedorNombre: user.name,
    })
    .from(ventas)
    .innerJoin(user, eq(user.id, ventas.usuarioId))
    .where(filtro)
    .orderBy(desc(ventas.creadoEn), desc(ventas.id))
    .limit(porPagina)
    .offset(salto);

  return { lista, cantidad, totalEmitido, pagina, paginas };
}

export type VentaFila = Awaited<
  ReturnType<typeof buscarVentas>
>["lista"][number];

async function obtenerItems(ventaIds: number[]) {
  return db
    .select({
      ventaId: itemsVenta.ventaId,
      cantidad: itemsVenta.cantidad,
      descripcion: itemsVenta.descripcion,
      imagenUrl: productos.imagenUrl,
    })
    .from(itemsVenta)
    .innerJoin(productos, eq(productos.id, itemsVenta.productoId))
    .where(inArray(itemsVenta.ventaId, ventaIds))
    .orderBy(asc(itemsVenta.id));
}

async function obtenerTotalesPorDia({
  dias,
  filtro,
  estado,
}: {
  dias: string[];
  filtro: SQL | undefined;
  estado?: EstadoVenta;
}) {
  return db
    .select({
      dia: DIA,
      cantidad: count(),
      total: sum(ventas.total).mapWith(ventas.total),
    })
    .from(ventas)
    .where(
      and(
        inArray(DIA, dias),
        estado === "anulada"
          ? isNotNull(ventas.anuladaEn)
          : isNull(ventas.anuladaEn),
        filtro,
      ),
    )
    .groupBy(DIA);
}

// RF-V8, VE-35 y VE-36: listado agrupado por día; los filtros valen también
// para la cantidad y el total de cada día.
export async function listarVentas(
  paginaPedida: number,
  filtros: FiltrosListado = {},
) {
  const filtro = armarFiltro(filtros);
  const { cantidad, totalEmitido } = await resumirFiltro(filtro);
  const { pagina, paginas, desde } = ubicarPagina({
    cantidad,
    porPagina: VENTAS_POR_PAGINA,
    pedida: paginaPedida,
  });

  const lista = await db
    .select({
      id: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numero: ventas.numero,
      anuladaEn: ventas.anuladaEn,
      creadoEn: ventas.creadoEn,
      clienteNombre: ventas.clienteNombre,
      formaPago: ventas.formaPago,
      total: ventas.total,
    })
    .from(ventas)
    .where(filtro)
    .orderBy(desc(ventas.creadoEn), desc(ventas.id))
    .limit(VENTAS_POR_PAGINA)
    .offset(desde);

  if (lista.length === 0) {
    return { grupos: [], pagina, paginas, cantidad, totalEmitido };
  }

  const dias = [...new Set(lista.map((venta) => claveDia(venta.creadoEn)))];
  const [items, totales] = await Promise.all([
    obtenerItems(lista.map((venta) => venta.id)),
    obtenerTotalesPorDia({ dias, filtro, estado: filtros.estado }),
  ]);

  const grupos = dias.map((dia) => {
    const delDia = totales.find((fila) => fila.dia === dia);

    return {
      dia,
      cantidad: delDia?.cantidad ?? 0,
      total: delDia?.total ?? "0",
      ventas: lista
        .filter((venta) => claveDia(venta.creadoEn) === dia)
        .map((venta) => ({
          ...venta,
          items: items.filter((item) => item.ventaId === venta.id),
        })),
    };
  });

  return { grupos, pagina, paginas, cantidad, totalEmitido };
}

const NOMBRE_CLIENTE = sql<string>`max(${ventas.clienteNombre})`;

// RF-V8: opciones de los selectores de vendedor y cliente del listado.
export async function listarOpcionesFiltro() {
  const [vendedores, clientes] = await Promise.all([
    db
      .selectDistinct({ id: user.id, nombre: user.name })
      .from(ventas)
      .innerJoin(user, eq(user.id, ventas.usuarioId))
      .orderBy(asc(user.name)),
    db
      .select({ id: ventas.clienteId, nombre: NOMBRE_CLIENTE })
      .from(ventas)
      .where(isNotNull(ventas.clienteId))
      .groupBy(ventas.clienteId)
      .orderBy(asc(NOMBRE_CLIENTE)),
  ]);

  return {
    vendedores,
    clientes: clientes.flatMap((cliente) =>
      cliente.id === null ? [] : [{ id: cliente.id, nombre: cliente.nombre }],
    ),
  };
}
