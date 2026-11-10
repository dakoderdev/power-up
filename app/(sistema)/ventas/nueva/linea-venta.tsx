"use client";

import { CLASE_CAMPO, CLASE_FILA, claseBoton } from "@/components/estilos";
import { Tapa } from "@/components/tapa";
import { aCentavos, deCentavos, formatearMoneda } from "@/lib/moneda";
import type { ProductoVendible } from "@/lib/productos/listado";

export type Linea = { producto: ProductoVendible; cantidad: number };

const SOLO_ESCRITORIO = "hidden sm:table-cell";

export const COLUMNAS_LINEA = [
  { titulo: "Producto", clase: "pr-3 sm:pr-6" },
  { titulo: "Cantidad", clase: "w-px pr-3 text-right sm:pr-6" },
  { titulo: "Precio", clase: `w-px pr-6 text-right ${SOLO_ESCRITORIO}` },
  { titulo: "Subtotal", clase: "w-px pr-3 text-right sm:pr-6" },
  { titulo: "Acción", clase: "w-px" },
];

export function subtotal(linea: Linea) {
  return aCentavos(linea.producto.precio) * linea.cantidad;
}

export function FilaLinea({
  linea,
  onCantidad,
  onQuitar,
}: {
  linea: Linea;
  onCantidad: (texto: string) => void;
  onQuitar: () => void;
}) {
  const { producto, cantidad } = linea;
  const faltaStock = cantidad > producto.stock;

  return (
    <tr className={CLASE_FILA}>
      <td className="max-w-0 py-2 pr-3 sm:pr-6">
        <div className="flex items-center gap-3">
          <Tapa url={producto.imagenUrl} className="h-8 w-6 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate">{producto.nombre}</span>
            <span className="truncate text-sm text-neutral-400">
              {producto.codigo} · Stock:{" "}
              <span
                className={`tabular-nums ${faltaStock ? "text-yellow-400/75" : ""}`}
              >
                {producto.stock}
              </span>
            </span>
          </div>
        </div>
      </td>
      <td className="pr-3 sm:pr-6">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={cantidad || ""}
          onChange={(evento) => onCantidad(evento.target.value)}
          aria-label={`Cantidad de ${producto.nombre}`}
          aria-invalid={faltaStock}
          className={`${CLASE_CAMPO} w-20 text-right tabular-nums ${faltaStock ? "border-yellow-400" : "border-neutral-800"}`}
        />
      </td>
      <td
        className={`pr-6 text-right tabular-nums text-neutral-300 ${SOLO_ESCRITORIO}`}
      >
        {formatearMoneda(producto.precio)}
      </td>
      <td className="pr-3 text-right tabular-nums sm:pr-6">
        {formatearMoneda(deCentavos(subtotal(linea)))}
      </td>
      <td>
        <button
          type="button"
          onClick={onQuitar}
          aria-label={`Quitar ${producto.nombre}`}
          className={claseBoton({ variante: "texto", enFormulario: true })}
        >
          Quitar
        </button>
      </td>
    </tr>
  );
}
