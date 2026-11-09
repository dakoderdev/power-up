import Link from "next/link";
import { Grid2x22 } from "pixelarticons/react/Grid2x22.js";
import { ListBox } from "pixelarticons/react/ListBox.js";
import { Search } from "pixelarticons/react/Search.js";
import { CLASE_CAMPO, claseBoton } from "@/components/estilos";
import { Tapa } from "@/components/tapa";
import { formatearMoneda } from "@/lib/moneda";
import {
  COLORES_ESTADO,
  ETIQUETAS_ESTADO,
  limpiarBusqueda,
  limpiarOrden,
  limpiarPagina,
  limpiarVista,
  listarProductos,
  type ParametrosListado,
} from "@/lib/productos/listado";
import type { Orden } from "@/lib/productos/ordenes";
import { Vacio } from "../resumen";
import { CLASE_FILA } from "../tabla-ventas";
import { Preferencias, SelectorOrden } from "./preferencias";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Producto", clase: "pr-3 sm:pr-6" },
  { titulo: "Código", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Estado", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Stock", clase: "w-px pr-3 text-right sm:pr-6" },
  { titulo: "Precio", clase: "w-px text-right" },
];

const VISTAS = [
  { valor: "lista", etiqueta: "Ver como lista", Icono: ListBox },
  { valor: "grilla", etiqueta: "Ver como grilla", Icono: Grid2x22 },
] as const;

function enlaceVista({
  vista,
  busqueda,
  orden,
  pagina = 1,
}: {
  vista: string;
  busqueda: string;
  orden: Orden;
  pagina?: number;
}) {
  const parametros = new URLSearchParams({ vista, orden });

  if (busqueda) {
    parametros.set("q", busqueda);
  }

  if (pagina > 1) {
    parametros.set("pagina", String(pagina));
  }

  return `/productos?${parametros.toString()}`;
}

export async function Listado({
  parametros,
}: {
  parametros: Promise<ParametrosListado>;
}) {
  const {
    q,
    vista: vistaPedida,
    orden: ordenPedido,
    pagina: paginaTexto,
  } = await parametros;
  const busqueda = limpiarBusqueda(q);
  const vista = limpiarVista(vistaPedida);
  const orden = limpiarOrden(ordenPedido);
  const sinPreferencias = !vistaPedida && !ordenPedido;
  await obtenerUsuarioActual();
  const { lista, pagina, paginas } = await listarProductos({
    busqueda,
    orden,
    paginaPedida: limpiarPagina(paginaTexto),
  });

  return (
    <section className="flex flex-col gap-4">
      <Preferencias vista={vista} orden={orden} aplicar={sinPreferencias} />
      <form
        role="search"
        action="/productos"
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="vista" value={vista} />
        <input type="hidden" name="orden" value={orden} />
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          maxLength={120}
          placeholder="Buscar por nombre o código"
          aria-label="Buscar por nombre o código"
          className={`${CLASE_CAMPO} max-w-md flex-1 border-neutral-800`}
        />
        <button
          type="submit"
          className={claseBoton({
            variante: "secundario",
            enFormulario: true,
          })}
        >
          <Search aria-hidden="true" className="size-5" />
          Buscar
        </button>
        {busqueda ? (
          <Link
            href={enlaceVista({ vista, busqueda: "", orden })}
            className={claseBoton({ variante: "texto", enFormulario: true })}
          >
            Limpiar
          </Link>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <SelectorOrden orden={orden} />
          <nav aria-label="Vista" className="flex">
            {VISTAS.map((opcion) => (
              <Link
                key={opcion.valor}
                href={enlaceVista({
                  vista: opcion.valor,
                  busqueda,
                  orden,
                  pagina,
                })}
                aria-label={opcion.etiqueta}
                aria-current={vista === opcion.valor ? "page" : undefined}
                className={`${claseBoton({ variante: vista === opcion.valor ? "secundario" : "texto", enFormulario: true })} ${vista === opcion.valor ? "" : "border border-transparent"}`}
              >
                <opcion.Icono aria-hidden="true" className="size-5" />
              </Link>
            ))}
          </nav>
        </div>
      </form>

      {lista.length === 0 ? (
        <Vacio>
          {busqueda
            ? `No hay productos que coincidan con "${busqueda}". Probá con otro nombre o código.`
            : "Todavía no hay productos. Cargá el primero con Nuevo producto."}
        </Vacio>
      ) : vista === "grilla" ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {lista.map((producto) => (
            <li key={producto.id} className="flex flex-col gap-2">
              <Tapa url={producto.imagenUrl} className="aspect-3/4 w-full" />
              <p className="line-clamp-2 text-[0.9375rem] font-medium">
                {producto.nombre}
              </p>
              <p className="text-sm tabular-nums text-neutral-300">
                {formatearMoneda(producto.precio)} · {producto.stock} unidades
                {producto.activo ? "" : ` · ${ETIQUETAS_ESTADO.inactivo}`}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-neutral-900">
                {COLUMNAS.map((columna) => (
                  <th
                    key={columna.titulo}
                    scope="col"
                    className={`h-9 text-sm font-medium text-neutral-400 ${columna.clase}`}
                  >
                    {columna.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((producto) => (
                <tr key={producto.id} className={CLASE_FILA}>
                  <td className="pr-3 sm:pr-6">
                    <div className="flex items-center gap-3">
                      <Tapa url={producto.imagenUrl} className="h-8 w-6" />
                      <span className="truncate">{producto.nombre}</span>
                    </div>
                  </td>
                  <td
                    className={`pr-6 tabular-nums text-neutral-300 ${SOLO_ESCRITORIO}`}
                  >
                    {producto.codigo}
                  </td>
                  <td className={`pr-6 ${SOLO_ESCRITORIO}`}>
                    <span
                      className={`inline-flex h-6 items-center border border-neutral-800 px-2 text-[0.8125rem] ${COLORES_ESTADO[producto.activo ? "activo" : "inactivo"]}`}
                    >
                      {
                        ETIQUETAS_ESTADO[
                          producto.activo ? "activo" : "inactivo"
                        ]
                      }
                    </span>
                  </td>
                  <td className="pr-3 text-right tabular-nums text-neutral-300 sm:pr-6">
                    {producto.stock}
                  </td>
                  <td className="text-right tabular-nums">
                    {formatearMoneda(producto.precio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 ? (
        <nav
          aria-label="Páginas"
          className="flex items-center justify-end gap-2"
        >
          <p className="mr-auto text-sm tabular-nums text-neutral-400">
            Página {pagina} de {paginas}
          </p>
          {pagina > 1 ? (
            <Link
              href={enlaceVista({ vista, busqueda, orden, pagina: pagina - 1 })}
              className={claseBoton({ variante: "secundario" })}
            >
              Anterior
            </Link>
          ) : null}
          {pagina < paginas ? (
            <Link
              href={enlaceVista({ vista, busqueda, orden, pagina: pagina + 1 })}
              className={claseBoton({ variante: "secundario" })}
            >
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
