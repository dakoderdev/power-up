import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "pixelarticons/react/Search.js";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { CLASE_BADGE, CLASE_CAMPO, CLASE_FILA } from "@/components/estilos";
import { Paginacion } from "@/components/paginacion";
import { Tapa } from "@/components/tapa";
import { Boton } from "@/components/ui/boton";
import { Vacio } from "@/components/vacio";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from "@/lib/estados";
import { limpiarPagina } from "@/lib/paginacion";
import { esStockBajo } from "@/lib/stock/etiquetas";
import {
  limpiarOrigen,
  limpiarProductoId,
  listarInventario,
} from "@/lib/stock/listado";
import { contar } from "@/lib/texto";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { CargarStock } from "./cargar-stock";
import { MovimientosProducto } from "./movimientos-producto";
import { CLASE_COLUMNA, enlaceStock, SOLO_ESCRITORIO } from "./_comun/stock";

export const metadata: Metadata = {
  title: "Stock · Power Up",
};

const CLASE_SECUNDARIO =
  "text-neutral-300 transition-colors group-hover:text-white";

type Parametros = {
  q?: string | string[];
  pagina?: string | string[];
  producto?: string | string[];
  origen?: string | string[];
};

export default function Stock({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Stock">
        Stock actual de cada producto, de menor a mayor. Entrá a uno para ver
        sus movimientos.
      </EncabezadoPagina>

      <Suspense
        fallback={<div aria-hidden="true" className="esqueleto h-96" />}
      >
        <Contenido parametros={searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenido({ parametros }: { parametros: Promise<Parametros> }) {
  const { esAdministrador } = await obtenerUsuarioActual();
  const { q, pagina, producto, origen } = await parametros;
  const productoId = limpiarProductoId(producto);
  const paginaPedida = limpiarPagina(pagina);

  return productoId ? (
    <MovimientosProducto
      productoId={productoId}
      origen={limpiarOrigen(origen)}
      paginaPedida={paginaPedida}
      puedeAjustar={esAdministrador}
    />
  ) : (
    <Inventario
      busqueda={limpiarBusqueda(q)}
      paginaPedida={paginaPedida}
      puedeAjustar={esAdministrador}
    />
  );
}

async function Inventario({
  busqueda,
  paginaPedida,
  puedeAjustar,
}: {
  busqueda: string;
  paginaPedida: number;
  puedeAjustar: boolean;
}) {
  const { lista, cantidad, pagina, paginas } = await listarInventario({
    busqueda,
    paginaPedida,
  });

  return (
    <section className="flex flex-col gap-4">
      <form
        role="search"
        action="/stock"
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          maxLength={120}
          placeholder="Buscar por nombre o código"
          aria-label="Buscar por nombre o código"
          className={`${CLASE_CAMPO} max-w-md flex-1 border-neutral-800`}
        />
        <Boton variante="secundario" enFormulario type="submit">
          <Search aria-hidden="true" className="size-5" />
          Buscar
        </Boton>
        {busqueda ? (
          <Boton asChild variante="texto" enFormulario>
            <Link href="/stock">Limpiar</Link>
          </Boton>
        ) : null}
      </form>

      <div className="flex min-h-10 items-center">
        <span className={`${CLASE_BADGE} text-neutral-300`}>
          {contar({ cantidad, singular: "producto", plural: "productos" })}
        </span>
      </div>

      {lista.length === 0 ? (
        <Vacio>
          {busqueda
            ? `No hay productos que coincidan con "${busqueda}". Probá con otro nombre o código.`
            : "Todavía no hay productos. Cargá el primero con Nuevo producto."}
        </Vacio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-neutral-900">
                <th scope="col" className={`${CLASE_COLUMNA} pr-3 sm:pr-6`}>
                  Producto
                </th>
                <th
                  scope="col"
                  className={`${CLASE_COLUMNA} w-px pr-6 ${SOLO_ESCRITORIO}`}
                >
                  Código
                </th>
                <th
                  scope="col"
                  className={`${CLASE_COLUMNA} w-px pr-6 ${SOLO_ESCRITORIO}`}
                >
                  Estado
                </th>
                <th scope="col" className={`${CLASE_COLUMNA} w-px text-right`}>
                  Stock
                </th>
                {puedeAjustar ? (
                  <th scope="col" className={`${CLASE_COLUMNA} w-px pl-6`}>
                    <span className="sr-only">Acciones</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {lista.map((producto) => (
                <tr
                  key={producto.id}
                  className={`${CLASE_FILA} group relative`}
                >
                  <td className="max-w-48 pr-3 sm:max-w-none sm:pr-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <Tapa
                        url={producto.imagenUrl}
                        className="h-8 w-6 shrink-0"
                      />
                      <Link
                        href={enlaceStock({ productoId: producto.id })}
                        className="truncate underline-offset-4 decoration-neutral-600 group-hover:underline after:absolute after:inset-0"
                      >
                        {producto.nombre}
                      </Link>
                    </div>
                  </td>
                  <td
                    className={`pr-6 tabular-nums ${CLASE_SECUNDARIO} ${SOLO_ESCRITORIO}`}
                  >
                    {producto.codigo}
                  </td>
                  <td className={`pr-6 ${SOLO_ESCRITORIO}`}>
                    <span
                      className={`${CLASE_BADGE} ${COLORES_ESTADO[producto.activo ? "activo" : "inactivo"]}`}
                    >
                      {
                        ETIQUETAS_ESTADO[
                          producto.activo ? "activo" : "inactivo"
                        ]
                      }
                    </span>
                  </td>
                  <td
                    className={`text-right tabular-nums ${esStockBajo(producto) ? "text-yellow-400/75" : "text-white"}`}
                  >
                    {producto.stock}
                    {esStockBajo(producto) ? (
                      <span className="sr-only"> (stock bajo)</span>
                    ) : null}
                  </td>
                  {puedeAjustar ? (
                    <td className="pl-6">
                      <CargarStock
                        productoId={producto.id}
                        nombre={producto.nombre}
                      />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) => enlaceStock({ busqueda, pagina: numero })}
      />
    </section>
  );
}
