import { cookies } from "next/headers";
import Link from "next/link";
import { Grid2x22 } from "pixelarticons/react/Grid2x22.js";
import { ListBox } from "pixelarticons/react/ListBox.js";
import { Tapa } from "@/components/tapa";
import { Paginacion } from "@/components/paginacion";
import { Buscador } from "@/components/buscador";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Vacio } from "@/components/vacio";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { limpiarPagina } from "@/lib/paginacion";
import { formatearMoneda } from "@/lib/moneda";
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from "@/lib/estados";
import {
  limpiarOrden,
  limpiarVista,
  listarProductos,
  type ParametrosListado,
} from "@/lib/productos/listado";
import {
  COOKIE_ORDEN,
  COOKIE_VISTA,
  type Orden,
} from "@/lib/productos/ordenes";
import { Preferencias, SelectorOrden } from "./preferencias";
import { enlaceStock } from "../stock/_comun/stock";
import { listarCategorias } from "@/lib/categorias/servicio";
import { esStockBajo } from "@/lib/stock/etiquetas";
import { Linea } from "@/components/maquetacion";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Producto", clase: "pr-3 sm:pr-6" },
  { titulo: "Código", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Categoría", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Estado", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Stock", clase: "w-px pr-3 text-right sm:pr-6" },
  { titulo: "Precio", clase: "w-px text-right" },
];

const COLOR_BAJO = "text-yellow-400/75";
const ETIQUETA_BAJO = "Bajo el mínimo";

// RF-P6: la ficha con existencia y movimientos es la misma para los dos roles.
function enlaceFicha(id: number) {
  return enlaceStock({ productoId: id });
}

function limpiarCategoria(texto: string | string[] | undefined) {
  const numero = Number(Array.isArray(texto) ? texto[0] : texto);

  return Number.isSafeInteger(numero) && numero > 0 ? numero : undefined;
}

const VISTAS = [
  { valor: "lista", etiqueta: "Ver como lista", Icono: ListBox },
  { valor: "grilla", etiqueta: "Ver como grilla", Icono: Grid2x22 },
] as const;

function enlaceVista({
  vista,
  busqueda,
  orden,
  categoria,
  pagina = 1,
}: {
  vista: string;
  busqueda: string;
  orden: Orden;
  categoria?: number;
  pagina?: number;
}) {
  const parametros = new URLSearchParams({ vista, orden });

  if (busqueda) {
    parametros.set("q", busqueda);
  }

  if (categoria) {
    parametros.set("categoria", String(categoria));
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
    categoria: categoriaTexto,
  } = await parametros;
  const categoria = limpiarCategoria(categoriaTexto);
  const busqueda = limpiarBusqueda(q);
  const guardadas = await cookies();
  const vista = limpiarVista(vistaPedida ?? guardadas.get(COOKIE_VISTA)?.value);
  const orden = limpiarOrden(ordenPedido ?? guardadas.get(COOKIE_ORDEN)?.value);
  await obtenerUsuarioActual();
  const [{ lista, pagina, paginas }, categorias] = await Promise.all([
    listarProductos({
      busqueda,
      orden,
      categoriaId: categoria,
      paginaPedida: limpiarPagina(paginaTexto),
    }),
    listarCategorias(),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <Preferencias vista={vista} orden={orden} />
      <Buscador
        ruta="/productos"
        busqueda={busqueda}
        etiqueta="Buscar por nombre o código"
        limpiar={enlaceVista({ vista, busqueda: "", orden })}
        ocultos={{ vista, orden }}
        filtrado={Boolean(categoria)}
      >
        {categoria ? (
          <input type="hidden" name="categoria" value={categoria} />
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <SelectorOrden orden={orden} />
          <nav aria-label="Vista" className="flex">
            {VISTAS.map((opcion) => (
              <Button
                key={opcion.valor}
                asChild
                variant={vista === opcion.valor ? "outline" : "ghost"}
                size="lg"
                className={
                  vista === opcion.valor ? "" : "border border-transparent"
                }
              >
                <Link
                  href={enlaceVista({
                    vista: opcion.valor,
                    busqueda,
                    orden,
                    categoria,
                    pagina,
                  })}
                  aria-label={opcion.etiqueta}
                  aria-current={vista === opcion.valor ? "page" : undefined}
                >
                  <opcion.Icono aria-hidden="true" className="size-5" />
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </Buscador>

      <ToggleGroup
        type="single"
        value={String(categoria ?? "")}
        aria-label="Filtrar por categoría"
      >
        {[{ id: undefined, nombre: "Todas" }, ...categorias].map((opcion) => {
          const elegida = opcion.id === categoria;

          return (
            <ToggleGroupItem
              key={opcion.id ?? "todas"}
              value={String(opcion.id ?? "")}
              asChild
              variant={elegida ? "outline" : "ghost"}
              className={elegida ? "text-verde" : "border border-neutral-900"}
            >
              <Link
                href={enlaceVista({
                  vista,
                  busqueda,
                  orden,
                  categoria: elegida ? undefined : opcion.id,
                })}
              >
                {opcion.nombre}
              </Link>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {lista.length === 0 ? (
        <Vacio>
          {busqueda || categoria
            ? "No hay productos que coincidan con la búsqueda. Probá con otro nombre, código o categoría."
            : "Todavía no hay productos. Cargá el primero con Nuevo producto."}
        </Vacio>
      ) : vista === "grilla" ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {lista.map((producto) => (
            <li key={producto.id}>
              <Link
                href={enlaceFicha(producto.id)}
                className="group flex flex-col gap-2"
              >
                <Tapa url={producto.imagenUrl} className="aspect-3/4 w-full" />
                <p className="line-clamp-2 text-[0.9375rem] font-medium underline-offset-4 decoration-neutral-600 group-hover:underline">
                  {producto.nombre}
                </p>
                <p className="text-sm tabular-nums text-neutral-300 transition-colors group-hover:text-white">
                  {formatearMoneda(producto.precio)} ·{" "}
                  <span
                    className={esStockBajo(producto) ? COLOR_BAJO : undefined}
                  >
                    {producto.stock} unidades
                  </span>
                  {esStockBajo(producto) ? ` · ${ETIQUETA_BAJO}` : ""}
                  {producto.activo ? "" : ` · ${ETIQUETAS_ESTADO.inactivo}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNAS.map((columna) => (
                <TableHead
                  key={columna.titulo}
                  scope="col"
                  className={columna.clase}
                >
                  {columna.titulo}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((producto) => (
              <TableRow key={producto.id} className="group relative">
                <TableCell className="pr-3 sm:pr-6">
                  <div className="flex items-center gap-3">
                    <Tapa url={producto.imagenUrl} className="h-8 w-6" />
                    <Link
                      href={enlaceFicha(producto.id)}
                      className="truncate underline-offset-4 decoration-neutral-600 group-hover:underline after:absolute after:inset-0"
                    >
                      {producto.nombre}
                    </Link>
                  </div>
                </TableCell>
                <TableCell
                  className={`pr-6 tabular-nums text-neutral-300 transition-colors group-hover:text-white ${SOLO_ESCRITORIO}`}
                >
                  {producto.codigo}
                </TableCell>
                <TableCell
                  className={`pr-6 whitespace-nowrap text-neutral-300 transition-colors group-hover:text-white ${SOLO_ESCRITORIO}`}
                >
                  {producto.categoriaNombre ?? "Sin categoría"}
                </TableCell>
                <TableCell className={`pr-6 ${SOLO_ESCRITORIO}`}>
                  <Badge
                    className={
                      COLORES_ESTADO[producto.activo ? "activo" : "inactivo"]
                    }
                  >
                    {ETIQUETAS_ESTADO[producto.activo ? "activo" : "inactivo"]}
                  </Badge>
                </TableCell>
                <TableCell className="pr-3 text-right tabular-nums text-neutral-300 transition-colors group-hover:text-white sm:pr-6">
                  {esStockBajo(producto) ? (
                    <Linea className={COLOR_BAJO} title={ETIQUETA_BAJO}>
                      {producto.stock}
                      <Linea className="sr-only"> ({ETIQUETA_BAJO})</Linea>
                    </Linea>
                  ) : (
                    producto.stock
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearMoneda(producto.precio)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) =>
          enlaceVista({ vista, busqueda, orden, categoria, pagina: numero })
        }
      />
    </section>
  );
}
