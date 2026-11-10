import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import { productos } from "@/lib/db/schema";
import { ubicarPagina } from "@/lib/paginacion";
import { ORDEN_INICIAL, ORDENES, type Orden } from "./ordenes";

const PRODUCTOS_POR_PAGINA = 32;

export type ParametrosListado = {
  q?: string | string[];
  vista?: string | string[];
  orden?: string | string[];
  pagina?: string | string[];
};

const UNIDADES_VENDIDAS = sql`coalesce((select sum(cantidad) from items_venta where items_venta.producto_id = ${productos.id}), 0)`;

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

export async function listarProductos({
  busqueda,
  orden,
  paginaPedida,
}: {
  busqueda: string;
  orden: Orden;
  paginaPedida: number;
}) {
  const filtro = busqueda
    ? coincideBusqueda({
        columnas: [productos.nombre, productos.codigo],
        busqueda,
      })
    : undefined;

  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(productos)
    .where(filtro);
  const { pagina, paginas, desde } = ubicarPagina({
    cantidad,
    porPagina: PRODUCTOS_POR_PAGINA,
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
    .limit(PRODUCTOS_POR_PAGINA)
    .offset(desde);

  return { lista, pagina, paginas };
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
