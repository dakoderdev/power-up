import Link from "next/link";
import { Tapa } from "@/components/tapa";
import { formatearHora } from "@/lib/fechas";
import type { obtenerResumenInicio } from "@/lib/inicio/resumen";
import { formatearMoneda } from "@/lib/moneda";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/etiquetas";
import { MasJuegos } from "./mas-juegos";

type Resumen = Awaited<ReturnType<typeof obtenerResumenInicio>>;
type VentaFila = Resumen["ventasHoy"]["ultimas"][number];

export const CLASE_FILA = "h-11 border-b border-neutral-900 last:border-b-0";

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Juegos", clase: "pr-3 sm:pr-6" },
  { titulo: "Comprobante", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Hora", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Cliente", clase: "w-px pr-3 sm:pr-6" },
  { titulo: "Forma de pago", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Total", clase: "w-px text-right" },
];

export function TablaVentas({ ventas }: { ventas: VentaFila[] }) {
  return (
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
          {ventas.map((venta) => (
            <tr key={venta.id} className={CLASE_FILA}>
              <td className="pr-3 sm:pr-6">
                <JuegosVenta items={venta.items} />
              </td>
              <td className={`pr-6 tabular-nums ${SOLO_ESCRITORIO}`}>
                <Link
                  href={`/ventas/${venta.id}`}
                  className="text-neutral-300 transition-colors hover:text-white"
                >
                  N.º {venta.numero}
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
                <span className="inline-flex h-6 items-center border border-neutral-800 px-2 text-[0.8125rem] text-neutral-300">
                  {ETIQUETAS_FORMA_PAGO[venta.formaPago]}
                </span>
              </td>
              <td className="text-right tabular-nums text-white">
                {formatearMoneda(venta.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
