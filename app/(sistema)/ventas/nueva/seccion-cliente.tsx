"use client";

import { useState } from "react";
import { Plus } from "pixelarticons/react/Plus.js";
import { Button } from "@/components/ui/button";
import type { ClienteVenta } from "@/lib/clientes/listado";
import { etiquetaDocumento } from "@/lib/documento";
import { buscarClientes } from "./api-venta";
import { CONSUMIDOR_FINAL } from "@/lib/ventas/etiquetas";
import { AltaCliente } from "./alta-cliente";
import { Combobox } from "./combobox";
import { Campo, Seccion } from "./seccion-venta";
import { Input } from "@/components/ui/input";

export function SeccionCliente({
  cliente,
  onCliente,
}: {
  cliente: ClienteVenta | null;
  onCliente: (cliente: ClienteVenta | null) => void;
}) {
  const [creando, setCreando] = useState(false);

  return (
    <Seccion
      titulo="Cliente"
      accion={
        <Button variant="ghost" type="button" onClick={() => setCreando(true)}>
          <Plus aria-hidden="true" className="size-5" />
          Nuevo cliente
        </Button>
      }
    >
      <AltaCliente
        abierto={creando}
        onCreado={(nuevo) => {
          onCliente(nuevo);
          setCreando(false);
        }}
        onCerrar={() => setCreando(false)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Combobox
          etiqueta="Cliente"
          placeholder="Buscar por nombre o documento"
          elegido={cliente?.nombre ?? CONSUMIDOR_FINAL}
          buscar={buscarClientes}
          onElegir={onCliente}
          opcionFija={{
            etiqueta: CONSUMIDOR_FINAL,
            onElegir: () => onCliente(null),
          }}
          renderOpcion={(opcion) => (
            <>
              <span className="min-w-0 flex-1 truncate">{opcion.nombre}</span>
              <span className="text-sm tabular-nums">
                {etiquetaDocumento(opcion)}
              </span>
            </>
          )}
        />
        <Campo etiqueta="Documento">
          <Input
            readOnly
            value={cliente ? etiquetaDocumento(cliente) : "—"}
            className="tabular-nums"
          />
        </Campo>
      </div>
    </Seccion>
  );
}
