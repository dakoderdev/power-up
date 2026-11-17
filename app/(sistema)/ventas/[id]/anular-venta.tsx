"use client";

import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { Button } from "@/components/ui/button";
import { anularVentaAccion } from "@/lib/ventas/acciones";
import { esquemaAnulacion, type Anulacion } from "@/lib/ventas/esquemas";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

export function AnularVenta({ ventaId }: { ventaId: number }) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [anulando, iniciarAnulacion] = useTransition();
  const [pendiente, setPendiente] = useState<Anulacion | null>(null);

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
    setPendiente(validacion.data);
  }

  function confirmar() {
    if (!pendiente) {
      return;
    }

    const datos = pendiente;
    setPendiente(null);
    iniciarAnulacion(async () => {
      const respuesta = await anularVentaAccion(datos);

      if (!respuesta.anulada) {
        setError(respuesta.mensaje);
        return;
      }

      toast.success("Venta anulada.", {
        description:
          "Se devolvió el stock y se ajustó el saldo si correspondía.",
      });
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
        <Field>
          <FieldLabel htmlFor={`${id}-motivo`}>Motivo</FieldLabel>
          <Input
            id={`${id}-motivo`}
            name="motivo"
            type="text"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
        </Field>
        <div className="flex justify-end">
          <Button variant="outline" size="lg" type="submit" disabled={anulando}>
            {anulando ? "Anulando…" : "Anular venta"}
          </Button>
        </div>
      </form>
      <ConfirmarAccion
        abierto={pendiente !== null}
        onCerrar={() => setPendiente(null)}
        titulo="¿Anular esta venta?"
        descripcion="Se devuelve el stock y, si fue en cuenta corriente, se resta el total del saldo del cliente. No se puede deshacer."
        accion="Anular venta"
        onConfirmar={confirmar}
      />
    </section>
  );
}
