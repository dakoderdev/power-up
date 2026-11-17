import Link from "next/link";
import { CLASE_FILA } from "@/components/estilos";
import { Tapa } from "@/components/tapa";
import { formatearHora } from "@/lib/fechas";
import type { obtenerResumenInicio } from "@/lib/inicio/resumen";
import { formatearMoneda } from "@/lib/moneda";
import { formatearComprobante } from "@/lib/ventas/comprobante";
import {
  COLORES_FORMA_PAGO,
  ETIQUETA_ANULADA,
  ETIQUETAS_FORMA_PAGO,
} from "@/lib/ventas/etiquetas";
import { MasJuegos } from "./mas-juegos";
import { Badge } from "@/components/ui/badge";

type Resumen = Awaited<ReturnType<typeof obtenerResumenInicio>>;
type VentaFila = Resumen["ventasHoy"]["ultimas"][number];

export type GrupoVentas = {
  clave: string;
  titulo?: string;
  detalle?: string;
  ventas: VentaFila[];
};

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Juegos", clase: "pr-3 sm:pr-6" },
  { titulo: "Comprobante", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Hora", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Cliente", clase: "w-px pr-3 sm:pr-6" },
  { titulo: "Forma de pago", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Total", clase: "w-px text-right" },
];

export function TablaVentas({ grupos }: { grupos: GrupoVentas[] }) {
  const agrupada = grupos.some((grupo) => grupo.titulo);

  return (
    <div className="overflow-x-auto">
      <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
        {agrupada ? null : (
          <thead>
            <FilaColumnas />
          </thead>
        )}
        {grupos.map((grupo, indice) => {
          const primero = indice === 0;

          return (
            <tbody key={grupo.clave}>
              {grupo.titulo ? (
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={COLUMNAS.length}
                    className={`text-left font-normal ${primero ? "pb-2" : "pb-2 pt-10"}`}
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <span className="text-[0.9375rem] font-medium text-white">
                        {grupo.titulo}
                      </span>
                      <span className="text-sm tabular-nums text-neutral-400">
                        {grupo.detalle}
                      </span>
                    </div>
                  </th>
                </tr>
              ) : null}
              {grupo.titulo ? <FilaColumnas /> : null}
              {grupo.ventas.map((venta) => (
                <tr key={venta.id} className={CLASE_FILA}>
                  <td className="pr-3 sm:pr-6">
                    <JuegosVenta items={venta.items} />
                  </td>
                  <td className={`pr-6 tabular-nums ${SOLO_ESCRITORIO}`}>
                    <Link
                      href={`/ventas/${venta.id}`}
                      className="text-neutral-300 transition-colors hover:text-white"
                    >
                      N.º {formatearComprobante(venta)}
                    </Link>
                  </td>
                  <td
                    className={`pr-6 tabular-nums text-neutral-300 ${SOLO_ESCRITORIO}`}
                  >
                    {formatearHora(venta.creadoEn)}
                  </td>
                  <td className="max-w-20 truncate pr-3 text-white sm:max-w-64 sm:pr-6">
                    {venta.clienteNombre}
                  </td>
                  <td className={`pr-6 ${SOLO_ESCRITORIO}`}>
                    <Badge className={COLORES_FORMA_PAGO[venta.formaPago]}>
                      {ETIQUETAS_FORMA_PAGO[venta.formaPago]}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums">
                    {venta.anuladaEn ? (
                      <span className="flex items-center justify-end gap-2">
                        <Badge variant="secondary">{ETIQUETA_ANULADA}</Badge>
                        <span className="text-neutral-400 line-through">
                          {formatearMoneda(venta.total)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-white">
                        {formatearMoneda(venta.total)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

function FilaColumnas() {
  return (
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
  );
}

function JuegosVenta({ items }: { items: VentaFila["items"] }) {
  const [primero, segundo] = items;
  const detalle = items
    .map((item) => `${item.cantidad} × ${item.descripcion}`)
    .join(", ");

  return (
    <div className="flex items-center">
      <div role="img" aria-label={detalle} className="relative size-8 shrink-0">
        {segundo ? (
          <Tapa
            url={segundo.imagenUrl}
            className="absolute left-3 top-0.5 h-7 w-5 opacity-50"
          />
        ) : null}
        <Tapa
          url={primero.imagenUrl}
          className={`absolute left-0 top-0 h-8 w-6 ${segundo ? "shadow-[2px_0_0_0_black]" : ""}`}
        />
      </div>
      <span className="shrink-0 pl-2 text-sm tabular-nums text-neutral-300 sm:w-10">
        {primero.cantidad > 1 ? `×${primero.cantidad}` : null}
      </span>
      <span
        title={primero.descripcion}
        className="max-w-24 truncate text-white sm:max-w-96"
      >
        {primero.descripcion}
      </span>
      {segundo ? (
        <MasJuegos etiqueta={`+${items.length - 1} más`}>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.descripcion} className="flex items-center gap-3">
                <Tapa url={item.imagenUrl} className="h-8 w-6 shrink-0" />
                <span className="w-6 shrink-0 text-sm tabular-nums text-neutral-300">
                  ×{item.cantidad}
                </span>
                <span className="max-w-64 truncate">{item.descripcion}</span>
              </li>
            ))}
          </ul>
        </MasJuegos>
      ) : null}
    </div>
  );
}
