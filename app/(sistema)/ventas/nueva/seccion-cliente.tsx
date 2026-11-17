"use client";

import { useState } from "react";
import { Plus } from "pixelarticons/react/Plus.js";
import { CLASE_CAMPO } from "@/components/estilos";
import { Boton } from "@/components/ui/boton";
import { buscarClientesAccion } from "@/lib/clientes/acciones";
import type { ClienteVenta } from "@/lib/clientes/listado";
import { CONSUMIDOR_FINAL } from "@/lib/ventas/etiquetas";
import { AltaCliente } from "./alta-cliente";
import { Combobox } from "./combobox";
import { Campo, Seccion } from "./seccion-venta";

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
        creando ? null : (
          <Boton
            variante="texto"
            type="button"
            onClick={() => setCreando(true)}
          >
            <Plus aria-hidden="true" className="size-5" />
            Nuevo cliente
          </Boton>
        )
      }
    >
      {creando ? (
        <AltaCliente
          onCreado={(nuevo) => {
            onCliente(nuevo);
            setCreando(false);
          }}
          onCancelar={() => setCreando(false)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Combobox
            etiqueta="Cliente"
            placeholder="Buscar por nombre o documento"
            elegido={cliente?.nombre ?? CONSUMIDOR_FINAL}
            buscar={buscarClientesAccion}
            onElegir={onCliente}
            opcionFija={{
              etiqueta: CONSUMIDOR_FINAL,
              onElegir: () => onCliente(null),
            }}
            renderOpcion={(opcion) => (
              <>
                <span className="min-w-0 flex-1 truncate">{opcion.nombre}</span>
                <span className="text-sm tabular-nums">{opcion.documento}</span>
              </>
            )}
          />
          <Campo etiqueta="Documento">
            <input
              readOnly
              value={cliente?.documento ?? "—"}
              className={`${CLASE_CAMPO} border-neutral-800 tabular-nums`}
            />
          </Campo>
        </div>
      )}
    </Seccion>
  );
}
