"use client";

import { useEffect } from "react";
import { claseBoton } from "@/components/estilos";
import { EncabezadoPagina } from "@/components/encabezado-pagina";

export default function ErrorPantalla({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Error" />
      <div className="flex max-w-2xl flex-col gap-4 border border-neutral-800 px-6 py-8">
        <p role="alert" className="text-[0.9375rem] text-red-400">
          No se pudo cargar esta pantalla.
        </p>
        <p className="text-sm text-neutral-400">
          Puede ser un corte de conexión con la base de datos. Probá de nuevo y,
          si sigue fallando, avisá al administrador.
        </p>
        <div>
          <button
            type="button"
            onClick={retry}
            className={claseBoton({
              variante: "secundario",
              enFormulario: true,
            })}
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
