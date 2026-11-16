import { and, asc, count, desc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import { itemsVenta, productos, ventas } from "@/lib/db/schema";
import { ubicarPagina } from "@/lib/paginacion";
import { UMBRAL_STOCK_BAJO } from "@/lib/stock/etiquetas";
import { ORDEN_INICIAL, ORDENES, type Orden } from "./ordenes";

const PRODUCTOS_POR_PAGINA = 36;

export type ParametrosListado = {
  q?: string | string[];
  vista?: string | string[];
  orden?: string | string[];
  pagina?: string | string[];
};

const UNIDADES_VENDIDAS = sql`coalesce((select sum(${itemsVenta.cantidad}) from ${itemsVenta} inner join ${ventas} on ${ventas.id} = ${itemsVenta.ventaId} where ${itemsVenta.productoId} = ${productos.id} and ${ventas.anuladaEn} is null), 0)`;

const CRITERIOS = {
  recientes: [desc(productos.creadoEn), desc(productos.id)],
  vendidos: [desc(UNIDADES_VENDIDAS), asc(productos.nombre)],
  nombre: [asc(productos.nombre), asc(productos.codigo)],
  precio_menor: [asc(productos.precio), asc(productos.nombre)],
  precio_mayor: [desc(productos.precio), asc(productos.nombre)],
  stock_mayor: [desc(productos.stock), asc(productos.nombre)],
  stock_menor: [asc(productos.stock), asc(productos.nombre)],
};

export function limpiarOrden(texto: string | string[] | undefined) {
  const valor = Array.isArray(texto) ? texto[0] : texto;

  return valor && valor in ORDENES ? (valor as Orden) : ORDEN_INICIAL;
}

export function limpiarVista(texto: string | string[] | undefined) {
  const valor = Array.isArray(texto) ? texto[0] : texto;

  return valor === "grilla" ? "grilla" : "lista";
}

// RF-P1: catálogo paginado con búsqueda por código o descripción y marca de stock bajo.
export async function listarProductos({
  busqueda,
  orden,
  paginaPedida,
  porPagina = PRODUCTOS_POR_PAGINA,
  activo,
  bajoMinimo = false,
}: {
  busqueda: string;
  orden: Orden;
  paginaPedida: number;
  porPagina?: number;
  activo?: boolean;
  bajoMinimo?: boolean;
}) {
  const filtro = and(
    busqueda
      ? coincideBusqueda({
          columnas: [productos.nombre, productos.codigo],
          busqueda,
        })
      : undefined,
    activo === undefined ? undefined : eq(productos.activo, activo),
    bajoMinimo
      ? and(eq(productos.activo, true), lte(productos.stock, UMBRAL_STOCK_BAJO))
      : undefined,
  );

  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(productos)
    .where(filtro);
  const { pagina, paginas, desde } = ubicarPagina({
    cantidad,
    porPagina,
    pedida: paginaPedida,
  });

  const lista = await db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      nombre: productos.nombre,
      precio: productos.precio,
      stock: productos.stock,
      activo: productos.activo,
      imagenUrl: productos.imagenUrl,
    })
    .from(productos)
    .where(filtro)
    .orderBy(...CRITERIOS[orden], asc(productos.id))
    .limit(porPagina)
    .offset(desde);

  return { lista, cantidad, pagina, paginas };
}

const LIMITE_BUSQUEDA_VENTA = 8;

export async function buscarProductosActivos(busqueda: string) {
  return db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      nombre: productos.nombre,
      precio: productos.precio,
      stock: productos.stock,
      imagenUrl: productos.imagenUrl,
    })
    .from(productos)
    .where(
      and(
        eq(productos.activo, true),
        busqueda
          ? coincideBusqueda({
              columnas: [productos.nombre, productos.codigo],
              busqueda,
            })
          : undefined,
      ),
    )
    .orderBy(asc(productos.nombre), asc(productos.id))
    .limit(LIMITE_BUSQUEDA_VENTA);
}

export type ProductoVendible = Awaited<
  ReturnType<typeof buscarProductosActivos>
>[number];
