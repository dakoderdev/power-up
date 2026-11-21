"use client";

import { AvisoError } from "@/components/aviso-error";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
      <h1 className="py-3 text-3xl font-semibold tracking-tight">Error</h1>
      <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card px-6 py-8 shadow-sm">
        <AvisoError>No se pudo cargar esta pantalla.</AvisoError>
        <p className="text-sm text-muted-foreground">
          Puede ser un corte de conexión con la base de datos. Probá de nuevo y,
          si sigue fallando, avisá al administrador.
        </p>
        <div>
          <Button variant="outline" type="button" onClick={retry}>
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}
