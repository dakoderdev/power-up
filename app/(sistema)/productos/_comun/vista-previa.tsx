"use client";

import { Tapa } from "@/components/tapa";
import { importePositivo } from "@/lib/esquemas-comunes";
import { formatearMoneda } from "@/lib/moneda";
import { esquemaProductoNuevo } from "@/lib/productos/esquemas";
import { ETIQUETAS_ESTADO } from "@/lib/productos/etiquetas";

export type Borrador = {
  codigo: string;
  nombre: string;
  precio: string;
  imagenUrl: string;
  stock: number;
  activo: boolean;
};

export function VistaPrevia({ borrador }: { borrador: Borrador }) {
  const precio = importePositivo.safeParse(borrador.precio);
  const imagen = esquemaProductoNuevo.shape.imagenUrl.safeParse(
    borrador.imagenUrl,
  );
  const url = imagen.success ? (imagen.data ?? null) : null;
  const stock =
    Number.isInteger(borrador.stock) && borrador.stock >= 0
      ? borrador.stock
      : 0;

  return (
    <aside
      aria-label="Vista previa"
      className="hidden w-56 shrink-0 flex-col gap-2 lg:flex"
    >
      <p className="text-sm font-medium text-neutral-400">Vista previa</p>
      <Tapa key={url ?? ""} url={url} className="aspect-3/4 w-full" />
      <p
        className={`line-clamp-2 text-[0.9375rem] font-medium ${borrador.nombre.trim() ? "" : "text-neutral-500"}`}
      >
        {borrador.nombre.trim() || "Nombre del producto"}
      </p>
      <p className="text-sm tabular-nums text-neutral-300">
        {precio.success ? formatearMoneda(precio.data) : "$ —"} · {stock}{" "}
        unidades
        {borrador.activo ? "" : ` · ${ETIQUETAS_ESTADO.inactivo}`}
      </p>
    </aside>
  );
}
