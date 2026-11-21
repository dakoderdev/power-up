import { PestanasProductos } from "@/components/pestanas-productos";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Buscador } from "@/components/buscador";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Paginacion } from "@/components/paginacion";
import { Tapa } from "@/components/tapa";
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
import { enlaceStock, SOLO_ESCRITORIO } from "./_comun/stock";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fila, Linea, Pagina, Seccion } from "@/components/maquetacion";

export const metadata: Metadata = {
  title: "Stock · Power Up",
};

const CLASE_SECUNDARIO =
  "text-foreground transition-colors group-hover:text-foreground";

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
    <Pagina>
      <EncabezadoPagina titulo="Productos">
        Stock actual de cada producto, de menor a mayor. Entrá a uno para ver
        sus movimientos.
      </EncabezadoPagina>

      <PestanasProductos actual="existencias" />

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Contenido parametros={searchParams} />
      </Suspense>
    </Pagina>
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
    <Seccion>
      <Buscador
        ruta="/stock"
        busqueda={busqueda}
        etiqueta="Buscar por nombre o código"
      />

      <Fila className="min-h-10">
        <Badge>
          {contar({ cantidad, singular: "producto", plural: "productos" })}
        </Badge>
      </Fila>

      {lista.length === 0 ? (
        <Vacio>
          {busqueda
            ? `No hay productos que coincidan con "${busqueda}". Probá con otro nombre o código.`
            : "Todavía no hay productos. Cargá el primero con Nuevo producto."}
        </Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="pr-3 sm:pr-6">
                Producto
              </TableHead>
              <TableHead scope="col" className={`w-px pr-6 ${SOLO_ESCRITORIO}`}>
                Código
              </TableHead>
              <TableHead scope="col" className={`w-px pr-6 ${SOLO_ESCRITORIO}`}>
                Estado
              </TableHead>
              <TableHead scope="col" className="w-px text-right">
                Stock
              </TableHead>
              {puedeAjustar ? (
                <TableHead scope="col" className="w-px pl-6">
                  <Linea className="sr-only">Acciones</Linea>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((producto) => (
              <TableRow key={producto.id} className="group relative">
                <TableCell className="max-w-48 pr-3 sm:max-w-none sm:pr-6">
                  <Fila className="min-w-0 gap-3">
                    <Tapa
                      url={producto.imagenUrl}
                      className="h-8 w-6 shrink-0"
                    />
                    <Link
                      href={enlaceStock({ productoId: producto.id })}
                      className="truncate underline-offset-4 decoration-muted-foreground group-hover:underline after:absolute after:inset-0"
                    >
                      {producto.nombre}
                    </Link>
                  </Fila>
                </TableCell>
                <TableCell
                  className={`pr-6 tabular-nums ${CLASE_SECUNDARIO} ${SOLO_ESCRITORIO}`}
                >
                  {producto.codigo}
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
                <TableCell
                  className={`text-right tabular-nums ${esStockBajo(producto) ? "text-yellow-400/75" : "text-foreground"}`}
                >
                  {producto.stock}
                  {esStockBajo(producto) ? (
                    <Linea className="sr-only"> (stock bajo)</Linea>
                  ) : null}
                </TableCell>
                {puedeAjustar ? (
                  <TableCell className="pl-6">
                    <CargarStock
                      productoId={producto.id}
                      nombre={producto.nombre}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) => enlaceStock({ busqueda, pagina: numero })}
      />
    </Seccion>
  );
}
