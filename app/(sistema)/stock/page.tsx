import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Paginacion } from "@/components/paginacion";
import { Vacio } from "@/components/vacio";
import { limpiarPagina } from "@/lib/paginacion";
import {
  limpiarOrigen,
  listarMovimientos,
  type OrigenStock,
} from "@/lib/stock/listado";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { formatearComprobante } from "@/lib/ventas/comprobante";

export const metadata: Metadata = {
  title: "Stock · Power Up",
};

const FILTROS: { valor?: OrigenStock; etiqueta: string }[] = [
  { etiqueta: "Todos" },
  { valor: "manual", etiqueta: "Ajustes manuales" },
  { valor: "venta", etiqueta: "Ventas" },
  { valor: "anulacion", etiqueta: "Anulaciones" },
];

const ETIQUETAS_ORIGEN: Record<OrigenStock, string> = {
  manual: "Ajuste manual",
  venta: "Venta",
  anulacion: "Anulación",
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

type Parametros = {
  pagina?: string | string[];
  origen?: string | string[];
};

function enlaceStock({
  origen,
  pagina,
}: {
  origen?: OrigenStock;
  pagina: number;
}) {
  const consulta = new URLSearchParams();

  if (origen) {
    consulta.set("origen", origen);
  }

  if (pagina > 1) {
    consulta.set("pagina", String(pagina));
  }

  const texto = consulta.toString();

  return texto ? `/stock?${texto}` : "/stock";
}

export default function Stock({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Stock">
        Movimientos de stock, del más reciente al más antiguo.
      </EncabezadoPagina>

      <Suspense
        fallback={<div aria-hidden="true" className="esqueleto h-96" />}
      >
        <Movimientos parametros={searchParams} />
      </Suspense>
    </div>
  );
}

async function Movimientos({
  parametros,
}: {
  parametros: Promise<Parametros>;
}) {
  await obtenerUsuarioActual();
  const { pagina: paginaTexto, origen: origenTexto } = await parametros;
  const origen = limpiarOrigen(origenTexto);
  const { movimientos, pagina, paginas } = await listarMovimientos({
    paginaPedida: limpiarPagina(paginaTexto),
    origen,
  });

  return (
    <section className="flex flex-col gap-4">
      <nav aria-label="Filtrar por origen" className="flex flex-wrap gap-2">
        {FILTROS.map((filtro) => {
          const activo = filtro.valor === origen;

          return (
            <Link
              key={filtro.etiqueta}
              href={enlaceStock({ origen: filtro.valor, pagina: 1 })}
              aria-current={activo ? "page" : undefined}
              className={`border px-3 py-1.5 text-sm transition-colors ${activo ? "border-neutral-800 bg-neutral-950 text-white" : "border-transparent text-neutral-400 hover:text-white"}`}
            >
              {filtro.etiqueta}
            </Link>
          );
        })}
      </nav>

      {movimientos.length === 0 ? (
        <Vacio>
          {origen
            ? "No hay movimientos con este origen."
            : "Todavía no hay movimientos de stock."}
        </Vacio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-neutral-900 text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-normal">Fecha</th>
                <th className="px-3 py-2 font-normal">Producto</th>
                <th className="px-3 py-2 font-normal">Origen</th>
                <th className="px-3 py-2 text-right font-normal">Cantidad</th>
                <th className="px-3 py-2 font-normal">Detalle</th>
                <th className="px-3 py-2 font-normal">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => (
                <tr
                  key={movimiento.id}
                  className="border-b border-neutral-900 align-top"
                >
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums text-neutral-400">
                    {FORMATO_FECHA.format(new Date(movimiento.creadoEn))}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/productos/${movimiento.productoId}`}
                      className="text-white hover:underline"
                    >
                      {movimiento.productoNombre}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {movimiento.productoCodigo}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block border px-2 py-0.5 text-xs ${movimiento.origen === "manual" ? "border-verde text-verde" : "border-neutral-800 text-neutral-400"}`}
                    >
                      {ETIQUETAS_ORIGEN[movimiento.origen]}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-3 text-right tabular-nums ${movimiento.tipo === "entrada" ? "text-verde" : "text-neutral-300"}`}
                  >
                    {movimiento.tipo === "entrada" ? "+" : "−"}
                    {movimiento.cantidad}
                  </td>
                  <td className="px-3 py-3 text-neutral-400">
                    {movimiento.ventaId ? (
                      <Link
                        href={`/ventas/${movimiento.ventaId}`}
                        className="hover:text-white hover:underline"
                      >
                        {formatearComprobante({
                          puntoVenta: movimiento.puntoVenta ?? 1,
                          numero: movimiento.numeroVenta ?? 0,
                        })}
                      </Link>
                    ) : (
                      (movimiento.motivo ?? "—")
                    )}
                  </td>
                  <td className="px-3 py-3 text-neutral-400">
                    {movimiento.usuarioNombre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) => enlaceStock({ origen, pagina: numero })}
      />
    </section>
  );
}
