import { asc, count, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import { productos } from "@/lib/db/schema";
import { ORDEN_INICIAL, ORDENES, type Orden } from "./ordenes";

const BUSQUEDA_MAXIMA = 120;
const PRODUCTOS_POR_PAGINA = 32;

export const ETIQUETAS_ESTADO = {
  activo: "Activo",
  inactivo: "Inactivo",
};

export const COLORES_ESTADO = {
  activo: "text-white",
  inactivo: "text-neutral-400",
};

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
};

export function limpiarOrden(texto: string | string[] | undefined) {
  const valor = Array.isArray(texto) ? texto[0] : texto;

  return valor && valor in ORDENES ? (valor as Orden) : ORDEN_INICIAL;
}

export function limpiarVista(texto: string | string[] | undefined) {
  const valor = Array.isArray(texto) ? texto[0] : texto;

  return valor === "grilla" ? "grilla" : "lista";
}

export function limpiarBusqueda(texto: string | string[] | undefined) {
  const valor = Array.isArray(texto) ? texto[0] : texto;

  return (valor ?? "").trim().slice(0, BUSQUEDA_MAXIMA);
}

export function limpiarPagina(texto: string | string[] | undefined) {
  const valor = Number(Array.isArray(texto) ? texto[0] : texto);

  return Number.isSafeInteger(valor) && valor >= 1 ? valor : 1;
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
  const paginas = Math.max(1, Math.ceil(cantidad / PRODUCTOS_POR_PAGINA));
  const pagina = Math.min(paginaPedida, paginas);

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
    .offset((pagina - 1) * PRODUCTOS_POR_PAGINA);

  return { lista, pagina, paginas };
}
