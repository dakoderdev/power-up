"use client";

import { Plus } from "pixelarticons/react/Plus.js";
import { Tapa } from "@/components/tapa";
import { formatearMoneda } from "@/lib/moneda";
import type { ProductoVendible } from "@/lib/productos/listado";
import { buscarProductos } from "./api-venta";
import { Combobox } from "./combobox";

export function BuscadorProductos({
  onElegir,
}: {
  onElegir: (producto: ProductoVendible) => void;
}) {
  return (
    <Combobox
      etiqueta="Agregar producto"
      placeholder="Buscar por nombre o código"
      buscar={buscarProductos}
      onElegir={onElegir}
      deshabilitada={(producto) => producto.stock === 0}
      renderOpcion={(producto) => (
        <>
          <Tapa url={producto.imagenUrl} className="h-8 w-6 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{producto.nombre}</span>
          <span className="hidden text-sm tabular-nums sm:inline">
            {producto.stock === 0 ? "Sin stock" : `Stock: ${producto.stock}`}
          </span>
          <span className="tabular-nums">
            {formatearMoneda(producto.precio)}
          </span>
          <Plus
            aria-hidden="true"
            className="size-5 shrink-0 group-disabled:invisible"
          />
        </>
      )}
    />
  );
}
