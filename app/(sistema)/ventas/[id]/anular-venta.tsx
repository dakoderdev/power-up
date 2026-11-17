"use client";

import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { CLASE_CAMPO } from "@/components/estilos";
import { Boton } from "@/components/ui/boton";
import { anularVentaAccion } from "@/lib/ventas/acciones";
import { esquemaAnulacion } from "@/lib/ventas/esquemas";

export function AnularVenta({ ventaId }: { ventaId: number }) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [anulando, iniciarAnulacion] = useTransition();

  function anular(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const validacion = esquemaAnulacion.safeParse({
      id: ventaId,
      motivoAnulacion: String(formulario.get("motivo") ?? ""),
    });

    if (!validacion.success) {
      setError(validacion.error.issues[0].message);
      return;
    }

    setError(null);
    iniciarAnulacion(async () => {
      const respuesta = await anularVentaAccion(validacion.data);

      if (!respuesta.anulada) {
        setError(respuesta.mensaje);
      }
    });
  }

  return (
    <section className="flex flex-col gap-4 border-t border-neutral-900 pt-10">
      <h2 className="font-pixel text-3xl leading-none tracking-[-0.01em]">
        Anular venta
      </h2>
      <p className="text-sm text-neutral-400">
        La venta queda visible como anulada: se devuelve el stock y, si fue en
        cuenta corriente, se resta el total del saldo del cliente. No se puede
        deshacer.
      </p>
      <form
        onSubmit={anular}
        noValidate
        className="flex max-w-2xl flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`${id}-motivo`}
            className="text-sm font-medium text-neutral-400"
          >
            Motivo
          </label>
          <input
            id={`${id}-motivo`}
            name="motivo"
            type="text"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`${CLASE_CAMPO} ${error ? "border-red-400" : "border-neutral-800"}`}
          />
          {error ? (
            <p id={`${id}-error`} role="alert" className="text-sm text-red-400">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Boton
            variante="secundario"
            enFormulario
            type="submit"
            disabled={anulando}
          >
            {anulando ? "Anulando…" : "Anular venta"}
          </Boton>
        </div>
      </form>
    </section>
  );
}
